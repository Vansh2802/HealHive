from django.urls import path

from .views import (
    AvailabilityDeleteView,
    AvailabilityListCreateView,
    BookSessionView,
    CreateSessionView,
    JoinSessionView,
    SessionFeedbackView,
    SessionListView,
)

urlpatterns = [
    path('', SessionListView.as_view(), name='session-list'),
    path('book', BookSessionView.as_view(), name='book-session'),
    path('create-session', CreateSessionView.as_view(), name='create-session'),
    path('<int:session_id>/join', JoinSessionView.as_view(), name='join-session'),
    path('<int:session_id>/feedback', SessionFeedbackView.as_view(), name='session-feedback'),

    # Availability endpoints
    path('availability/', AvailabilityListCreateView.as_view(), name='availability-list-create'),
    path('availability/<int:availability_id>/', AvailabilityDeleteView.as_view(), name='availability-delete'),
]
