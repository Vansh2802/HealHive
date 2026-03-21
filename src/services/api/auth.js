// ─── Auth API Service ───
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function setToken(token) {
    localStorage.setItem('healhive_token', token)
}

export function getToken() {
    return localStorage.getItem('healhive_token')
}

export function clearToken() {
    localStorage.removeItem('healhive_token')
}

export async function login(email, password, role) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        })
        const data = await res.json()
        if (data.success && data.token) {
            setToken(data.token)
        }
        return data
    } catch {
        return { success: false, error: 'Unable to connect to server. Please try again.' }
    }
}

export async function register(name, email, password, role, extras = {}) {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, ...extras }),
        })
        const data = await res.json()
        // Don't set token for therapist registration — they need admin approval first
        if (data.success && data.token && role !== 'therapist') {
            setToken(data.token)
        }
        return data
    } catch {
        return { success: false, error: 'Unable to connect to server. Please try again.' }
    }
}

export async function fetchMe() {
    const token = getToken()
    if (!token) return null
    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.success ? data.user : null
    } catch {
        return null
    }
}
