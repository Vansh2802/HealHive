// ─── Admin API Service ───
import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Fetch admin stats
export async function fetchAdminStats() {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return {
            success: true,
            stats: {
                totalUsers: data.metrics?.totalUsers || 0,
                totalTherapists: data.metrics?.totalTherapists || 0,
                pendingTherapists: data.metrics?.pendingTherapists || 0,
                totalSessions: data.metrics?.totalSessions || 0,
            },
        }
    } catch (error) {
        console.error('[Admin API] fetchAdminStats error:', error)
        return { success: false, stats: {} }
    }
}

// Fetch all therapists (for admin management)
export async function fetchAdminTherapists() {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/therapists/all`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        console.log('[Admin API] fetchAdminTherapists response:', data)
        return { success: true, therapists: data.success ? data.therapists : [] }
    } catch (error) {
        console.error('[Admin API] fetchAdminTherapists error:', error)
        return { success: false, therapists: [] }
    }
}

// Fetch all sessions
export async function fetchAdminSessions() {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/admin/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return { success: true, sessions: data.success ? data.sessions : [] }
    } catch (error) {
        console.error('[Admin API] fetchAdminSessions error:', error)
        return { success: false, sessions: [] }
    }
}

// Review (verify/reject) a therapist
export async function reviewTherapist(therapistId, action) {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/therapists/${therapistId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action }),
        })
        const data = await res.json()
        console.log('[Admin API] reviewTherapist response:', data)
        return data
    } catch (error) {
        console.error('[Admin API] reviewTherapist error:', error)
        return { success: false, error: 'Failed to update therapist.' }
    }
}

// Backward compat
export const fetchAdminDashboard = fetchAdminStats
export const fetchAllTherapists = fetchAdminTherapists
