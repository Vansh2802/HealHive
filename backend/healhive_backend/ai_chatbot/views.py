import json
from functools import wraps
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST
from accounts.models import User
from .forms import SignupForm, EmailLoginForm
from .models import ChatConversation, ChatMessage, MentalHealthReport
from .services.orchestrator import ChatbotOrchestrator, ensure_test_catalog, get_or_create_conversation, DISCLAIMER
from .services.screening_service import ClaudeScreeningService, SCREENING_QUESTIONS


def redirect_by_role(user):
    if user.role == User.ROLE_THERAPIST:
        return redirect('therapist-dashboard')
    if user.role == User.ROLE_ADMIN:
        return redirect('admin-dashboard')
    return redirect('user-dashboard')


def role_required(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('chatbot-login')
            if request.user.role not in allowed_roles:
                return redirect_by_role(request.user)
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator


def signup_view(request):
    if request.user.is_authenticated:
        return redirect_by_role(request.user)

    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect_by_role(user)

    return render(request, "auth_signup.html", {"form": form})


class EmailLoginView(LoginView):
    template_name = "auth_login.html"
    authentication_form = EmailLoginForm

    def get_success_url(self):
        if self.request.user.role == User.ROLE_THERAPIST:
            return "/therapist/dashboard/"
        if self.request.user.role == User.ROLE_ADMIN:
            return "/admin-panel/dashboard/"
        return "/user/dashboard/"


@login_required
def logout_view(request):
    logout(request)
    return redirect("chatbot-login")


@login_required
@role_required(User.ROLE_USER)
def chatbot_home(request):
    ensure_test_catalog()
    conversation = ChatConversation.objects.filter(user=request.user).first()
    messages = []
    if conversation:
        messages = list(conversation.messages.values("role", "content", "created_at"))

    return render(
        request,
        "chatbot/chatbot.html",
        {
            "disclaimer": DISCLAIMER,
            "conversation": conversation,
            "messages": messages,
        },
    )


@login_required
@role_required(User.ROLE_USER)
def user_dashboard(request):
    reports_count = MentalHealthReport.objects.filter(user=request.user).count()
    return render(request, "chatbot/user_dashboard.html", {"reports_count": reports_count})


@login_required
@role_required(User.ROLE_THERAPIST)
def therapist_dashboard(request):
    reports = MentalHealthReport.objects.filter(
        user__patient_profile__assigned_therapist__user=request.user
    ).select_related("user", "test")[:100]
    return render(request, "chatbot/therapist_dashboard.html", {"reports": reports})


@login_required
@role_required(User.ROLE_ADMIN)
def admin_dashboard(request):
    context = {
        "total_users": User.objects.filter(role=User.ROLE_USER).count(),
        "total_therapists": User.objects.filter(role=User.ROLE_THERAPIST).count(),
        "total_reports": MentalHealthReport.objects.count(),
        "recent_reports": MentalHealthReport.objects.select_related("test").order_by("-created_at")[:10],
    }
    return render(request, "chatbot/admin_dashboard.html", context)


@login_required
@require_GET
@role_required(User.ROLE_USER)
def reports_view(request):
    reports = MentalHealthReport.objects.filter(user=request.user).select_related("test")[:20]
    return render(request, "chatbot/reports.html", {"reports": reports})


@login_required
@require_POST
@role_required(User.ROLE_USER)
def chat_message_api(request):
    ensure_test_catalog()

    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        payload = {}

    user_message = (payload.get("message") or "").strip()
    conversation_id = payload.get("conversation_id")

    conversation = get_or_create_conversation(request.user, conversation_id)
    if not conversation:
        return JsonResponse({"success": False, "error": "Conversation not found."}, status=404)

    orchestrator = ChatbotOrchestrator()
    result = orchestrator.process(conversation, user_message)

    return JsonResponse(
        {
            "success": True,
            "conversation_id": conversation.id,
            "state": result.get("state"),
            "response": result.get("message"),
            "progress": result.get("progress", {"current": 0, "total": 0}),
            "report_id": result.get("report_id"),
        }
    )


@login_required
@require_GET
@role_required(User.ROLE_USER)
def conversation_messages_api(request, conversation_id):
    conversation = ChatConversation.objects.filter(id=conversation_id, user=request.user).first()
    if not conversation:
        return JsonResponse({"success": False, "error": "Conversation not found"}, status=404)

    messages = list(conversation.messages.values("role", "content", "created_at"))
    return JsonResponse({"success": True, "messages": messages})


@api_view(["POST"])
@permission_classes([AllowAny])
def public_chat_message_api(request):
    payload = request.data if isinstance(request.data, dict) else {}
    user_message = str(payload.get("message") or "").strip()
    session_id = str(payload.get("sessionId") or "anonymous-session")

    if not user_message:
        return Response({"success": False, "error": "Message is required."}, status=400)

    screening_service = ClaudeScreeningService()
    session = screening_service.get_or_create_session(session_id=session_id, user=request.user)

    # Already completed
    if session.completed:
        return Response({
            "success": True,
            "reply": "Your screening is already complete for this session. Start a new chat to run a fresh check-in.",
            "flagged": False,
            "toolUsed": "claude-screening",
            "severity": None,
            "score": None,
        })

    # Conversational phase -- natural Claude replies for first 2 turns
    if not session.screening_started:
        conv_reply = screening_service.get_conversational_reply(
            user_message, list(session.chat_history or [])
        )

        history = list(session.chat_history or [])
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": conv_reply})
        new_turns = session.chat_turns + 1

        if new_turns >= 2:
            # After 2 natural exchanges, bridge into structured screening
            bridge = (
                "\n\nTo support you better, I would like to do a brief "
                + str(len(SCREENING_QUESTIONS))
                + "-question wellness check-in. Here is the first question:\n\n"
                + "Screening Question 1/"
                + str(len(SCREENING_QUESTIONS))
                + ": "
                + SCREENING_QUESTIONS[0]
            )
            final_reply = conv_reply + bridge
            session.screening_started = True
            session.chat_history = history
            session.chat_turns = new_turns
            session.save(update_fields=["screening_started", "chat_history", "chat_turns", "updated_at"])
        else:
            final_reply = conv_reply
            session.chat_history = history
            session.chat_turns = new_turns
            session.save(update_fields=["chat_history", "chat_turns", "updated_at"])

        return Response({
            "success": True,
            "reply": final_reply,
            "flagged": False,
            "toolUsed": "claude-chat",
            "severity": None,
            "score": None,
        })

    # Structured screening phase
    result = screening_service.run_step(session=session, user_message=user_message)
    report_data = result.get("report") or {}
    severity = report_data.get("severity")
    flagged = severity == "HIGH"

    return Response(
        {
            "success": True,
            "reply": result.get("reply"),
            "flagged": flagged,
            "toolUsed": "claude-screening",
            "severity": severity,
            "score": None,
        }
    )
