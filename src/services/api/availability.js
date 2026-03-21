// ─── Therapist Availability API Service ───
import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function fetchAvailability() {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/therapists/my/availability`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) return []
        return data.availabilities.map(slot => ({
            id: slot._id,
            start_time: `${slot.date}T${slot.startTime}`,
            end_time: `${slot.date}T${slot.endTime}`,
            is_booked: slot.isBooked,
        }))
    } catch {
        return []
    }
}

export async function createAvailability({ start_time, end_time }) {
    const token = getToken()
    // Parse datetime-local values into date + time components
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)
    const date = startDate.toISOString().slice(0, 10)
    const startTime = startDate.toTimeString().slice(0, 5)
    const endTime = endDate.toTimeString().slice(0, 5)

    try {
        const res = await fetch(`${API_URL}/therapists/my/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ date, startTime, endTime }),
        })
        return await res.json()
    } catch {
        return { success: false, error: 'Failed to add availability.' }
    }
}

export async function deleteAvailability(id) {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/therapists/my/availability/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        return await res.json()
    } catch {
        return { success: false, error: 'Failed to delete slot.' }
    }
}
