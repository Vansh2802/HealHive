// ─── Sessions API Service ───
import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const IST_TIMEZONE = 'Asia/Kolkata'

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
function extractErrorMessage(errorValue, fallback) {
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

function extractApiError(data, fallback) {
    if (!data || typeof data !== 'object') {
        return fallback
    }
    if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail
    }
    return extractErrorMessage(data.error, fallback)
}

export async function createSessionBooking({ therapistId, slotId, start_time, end_time }) {
    try {
        const token = getToken()
        const res = await fetch(`${API_URL}/sessions/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                therapist_id: therapistId, 
                availability_id: slotId,
                start_time: start_time,
                end_time: end_time,
                // Backward-compatible field (older backend expects session_time)
                session_time: start_time,
            }),
        })
        let data = null
        try {
            data = await res.json()
        } catch {
            return { success: false, error: 'Booking failed (invalid server response).' }
        }

        if (!res.ok || !data?.success) {
            return { success: false, error: extractApiError(data, 'Unable to book session. Please try again.') }
        }

        return data
    } catch {
        return { success: false, error: 'Unable to book session. Please try again.' }
    }
}

// Map session from API response
function mapSession(session, role = 'user') {
    const dateObj = new Date(session.session_time)
    const safeDate = Number.isNaN(dateObj.getTime()) ? null : dateObj

    const endObj = session.session_end_time ? new Date(session.session_end_time) : null
    const safeEndDate = endObj && !Number.isNaN(endObj.getTime()) ? endObj : null

    const formattedStartTime = safeDate
        ? safeDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: IST_TIMEZONE,
        })
        : ''
    const formattedEndTime = safeEndDate
        ? safeEndDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: IST_TIMEZONE,
        })
        : ''

    const timeRange = formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime

    return {
        id: session.id,
        therapistName: role === 'therapist'
            ? (session.patient_name || 'Patient')
            : (session.therapist_name || 'Therapist'),
        date: session.date || (safeDate
            ? safeDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: IST_TIMEZONE,
            })
            : ''),
        time: session.time || timeRange,
        session_time: session.session_time,
        session_end_time: session.session_end_time,
        status: session.status || session.session_status || 'upcoming',
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

// Fetch therapist's upcoming sessions (with Google Meet links)
export async function fetchTherapistUpcomingSessions() {
    try {
        const token = getToken()
        const res = await fetch(`${API_URL}/therapist/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) return []
        return data.sessions.map(s => ({
            id: s.id,
            patient_name: s.patient_name,
            patient_email: s.patient_email,
            session_time: s.session_time,
            session_end_time: s.session_end_time,
            meeting_link: s.meeting_link,
            status: s.status,
        }))
    } catch (error) {
        console.error('Error fetching therapist sessions:', error)
        return []
    }
}
