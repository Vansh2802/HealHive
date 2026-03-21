// ─── Session / Booking Routes ───
import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import Session from '../models/Session.js'
import Therapist from '../models/Therapist.js'
import User from '../models/User.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/sessions — book a session
router.post('/', verifyToken, requireRole('user'), async (req, res) => {
    try {
        const { therapistId, slotId } = req.body
        if (!therapistId || !slotId) {
            return res.status(400).json({ success: false, error: 'therapistId and slotId are required.' })
        }

        // Find therapist and the specific slot
        const therapist = await Therapist.findById(therapistId)
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found.' })

        const slot = therapist.availability.id(slotId)
        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found.' })
        if (slot.isBooked) return res.status(409).json({ success: false, error: 'This slot is already booked.' })

        // Lock the slot (prevent double booking)
        slot.isBooked = true
        await therapist.save()

        // Generate a Google Meet-style meeting link
        const meetingId = uuidv4().slice(0, 12).replace(/(.{4})/g, '$1-').slice(0, -1)
        const meetingLink = `https://meet.google.com/${meetingId}`

        // Create the session
        const session = await Session.create({
            userId: req.user.id,
            therapistId: therapist.userId,
            date: slot.date,
            time: `${slot.startTime} - ${slot.endTime}`,
            meetingLink,
            status: 'scheduled',
        })

        res.status(201).json({ success: true, session, meetingLink })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/sessions — list my sessions (role-aware)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { role, id } = req.user
        let query = {}
        if (role === 'user') query.userId = id
        else if (role === 'therapist') query.therapistId = id
        // admin sees all

        const sessions = await Session.find(query)
            .populate('userId', 'name email')
            .populate('therapistId', 'name email')
            .sort({ date: -1 })

        const mapped = sessions.map(s => ({
            id: s._id,
            patient_name: s.userId?.name || 'Patient',
            therapist_name: s.therapistId?.name || 'Therapist',
            session_time: `${s.date}T${s.time.split(' - ')[0] || '00:00'}`,
            session_status: s.status,
            meeting_link: s.meetingLink,
            date: s.date,
            time: s.time,
        }))

        res.json({ success: true, sessions: mapped })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// PATCH /api/sessions/:id/status — update session status
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body
        if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status.' })
        }
        const session = await Session.findByIdAndUpdate(req.params.id, { status }, { new: true })
        if (!session) return res.status(404).json({ success: false, error: 'Session not found.' })
        res.json({ success: true, session })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
