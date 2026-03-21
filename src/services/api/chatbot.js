// ─── Chat API Service ───
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TIMEOUT_MS = 30000

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

export async function sendMessage(message, sessionId, history) {
    try {
        const res = await fetchWithTimeout(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId, history }),
        })
        const data = await res.json()
        return data
    } catch (error) {
        return { success: false, error: 'Unable to connect to chatbot service.' }
    }
}
