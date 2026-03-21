// ─── Sessions API Service ───
import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Fetch verified therapists with their availability
export async function fetchAvailableTherapists() {
    try {
        const res = await fetch(`${API_URL}/therapists`)
        const data = await res.json()
        if (!data.success) return []
        return data.therapists.map(t => ({
            id: t.id,
            userId: t.userId,
            name: t.name,
            email: t.email,
            specialization: t.specialization,
            bio: t.bio,
            availability: (t.availability || []).map(slot => ({
                id: slot._id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: slot.isBooked,
            })),
        }))
    } catch {
        return []
    }
}

// Book a session
export async function createSessionBooking({ therapistId, slotId }) {
    try {
        const token = getToken()
        const res = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ therapistId, slotId }),
        })
        return await res.json()
    } catch {
        return { success: false, error: 'Unable to book session. Please try again.' }
    }
}

// Map session from API response
function mapSession(session, role = 'user') {
    const dateObj = new Date(session.session_time)
    const safeDate = Number.isNaN(dateObj.getTime()) ? null : dateObj
    return {
        id: session.id,
        therapistName: role === 'therapist'
            ? (session.patient_name || 'Patient')
            : (session.therapist_name || 'Therapist'),
        date: session.date || (safeDate ? safeDate.toISOString().slice(0, 10) : ''),
        time: session.time || (safeDate
            ? safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''),
        session_time: session.session_time,
        status: session.session_status === 'scheduled' ? 'upcoming' : session.session_status,
        type: 'video',
        meeting_link: session.meeting_link,
    }
}

// Fetch my sessions
export async function fetchMySessions(role = 'user') {
    try {
        const token = getToken()
        const res = await fetch(`${API_URL}/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) return []
        return data.sessions.map(s => mapSession(s, role))
    } catch {
        return []
    }
}
