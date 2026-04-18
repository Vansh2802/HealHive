function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const root = document.getElementById('chatRoot');
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const progressText = document.getElementById('progressText');
let conversationId = root?.dataset?.conversationId || null;

function addBubble(role, content) {
  const div = document.createElement('div');
  div.className = `bubble ${role}`;
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addBubble('user', text);
  inputEl.value = '';
  sendBtn.disabled = true;

  try {
    const res = await fetch('/chatbot/api/message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: text,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      addBubble('assistant', 'Sorry, something went wrong. Please try again.');
      return;
    }

    conversationId = data.conversation_id;
    addBubble('assistant', data.response || 'Thanks for sharing.');

    const progress = data.progress || { current: 0, total: 0 };
    if (progress.total > 0) {
      progressText.textContent = `Assessment Progress: ${progress.current}/${progress.total}`;
    } else {
      progressText.textContent = '';
    }
  } catch (err) {
    addBubble('assistant', 'Network error. Please retry.');
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

sendBtn?.addEventListener('click', sendMessage);
inputEl?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
});
