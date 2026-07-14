// ─── Auth API Service ───
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function extractErrorMessage(errorValue, fallback = 'Request failed. Please try again.') {
    if (typeof errorValue === 'string' && errorValue.trim()) {
        return errorValue
    }
    if (errorValue && typeof errorValue === 'object') {
        const firstKey = Object.keys(errorValue)[0]
        const firstValue = firstKey ? errorValue[firstKey] : null
        if (Array.isArray(firstValue) && firstValue.length > 0) {
            return String(firstValue[0])
        }
        if (typeof firstValue === 'string' && firstValue.trim()) {
            return firstValue
        }
    }
    return fallback
}

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
        if (!res.ok) {
            return { success: false, error: extractErrorMessage(data.error, 'Login failed. Please try again.') }
        }
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
        if (!res.ok) {
            return { success: false, error: extractErrorMessage(data.error, 'Signup failed. Please try again.') }
        }
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

export async function updateProfile(fields) {
    const token = getToken()
    if (!token) return { success: false, error: 'Not authenticated' }
    try {
        const res = await fetch(`${API_URL}/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(fields)
        })
        const data = await res.json()
        if (!res.ok) {
            return { success: false, error: extractErrorMessage(data.error, 'Failed to update profile.') }
        }
        return data
    } catch {
        return { success: false, error: 'Unable to connect to server.' }
    }
}
