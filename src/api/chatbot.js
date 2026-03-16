// ─── HealHive Backend Chat Integration ───
// Sends messages to Django backend and persists therapist report metadata.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BACKEND_CHAT_URL = `${API_URL}/api/chatbot/message`
const TIMEOUT_MS = 30000   // 30s — assessment scoring steps can be slow

async function fetchWithTimeout(url, options, timeout = TIMEOUT_MS) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(id)
        return response
    } catch (error) {
        clearTimeout(id)
        throw error
    }
}

// ─── Save therapist report to backend (fire-and-forget) ───
async function saveTherapistReport(sessionId, userMessage, therapistReport, meta = {}) {
    try {
        await fetch(`${API_URL}/api/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                userMessage,
                therapistReport,
                toolUsed: meta.toolUsed || null,
                score: meta.score || null,
                severity: meta.severity || null,
            }),
        })
    } catch {
        // Non-critical — don't surface this error to the user
    }
}

export async function sendMessage(message, sessionId = null, history = []) {
    try {
        const backendResponse = await fetchWithTimeout(BACKEND_CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                sessionId,
                history: history.map(m => ({
                    role: m.isBot ? 'assistant' : 'user',
                    content: m.text,
                })),
                timestamp: new Date().toISOString(),
            }),
        })

        if (backendResponse.ok) {
            const data = await backendResponse.json()
            if (data?.success && data.reply) {
                if (data.therapistReport && sessionId) {
                    saveTherapistReport(
                        sessionId,
                        message,
                        data.therapistReport,
                        { toolUsed: data.toolUsed, score: data.score, severity: data.severity }
                    )
                }

                return {
                    success: true,
                    reply: data.reply,
                    flagged: data.flagged || false,
                }
            }
        }
    } catch (error) {
        return {
            success: false,
            error: error?.name === 'AbortError'
                ? 'Request timed out. Please try again.'
                : 'Unable to connect to HealHive backend. Please check your server and try again.',
        }
    }

    return {
        success: false,
        error: 'No valid response from HealHive backend.',
    }
}
