// ─── Therapist Availability API Service ───
import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function mapAvailabilitySlot(slot) {
    return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_booked: slot.is_booked,
    }
}

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

export async function fetchAvailability() {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/sessions/availability/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
            return []
        }
        const data = await res.json()
        if (!data.success) return []
        return (data.availabilities || []).map(mapAvailabilitySlot)
    } catch {
        return []
    }
}

export async function createAvailability({ start_time, end_time }) {
    const token = getToken()

    try {
        const res = await fetch(`${API_URL}/sessions/availability/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ start_time, end_time }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
            return {
                success: false,
                error: extractErrorMessage(data.error, 'Failed to add availability.'),
            }
        }
        return {
            success: true,
            availability: mapAvailabilitySlot(data.availability),
        }
    } catch {
        return { success: false, error: 'Failed to add availability.' }
    }
}

export async function deleteAvailability(id) {
    const token = getToken()
    try {
        const res = await fetch(`${API_URL}/sessions/availability/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
            return { success: false, error: extractErrorMessage(data.error, 'Failed to delete slot.') }
        }
        return { success: true }
    } catch {
        return { success: false, error: 'Failed to delete slot.' }
    }
}
