// ─── Therapist Routes ───
import { Router } from 'express'
import Therapist from '../models/Therapist.js'
import User from '../models/User.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/therapists — list verified therapists (for booking)
router.get('/', async (req, res) => {
    try {
        const therapists = await Therapist.find({ verified: true, isActive: true })
            .populate('userId', 'name email')
        const result = therapists.map(t => ({
            id: t._id,
            userId: t.userId?._id,
            name: t.userId?.name || 'Unknown',
            email: t.userId?.email,
            specialization: t.specialization,
            bio: t.bio,
            licenseNumber: t.licenseNumber,
            universityName: t.universityName,
            verified: t.verified,
            isActive: t.isActive,
            availability: t.availability.filter(slot => !slot.isBooked),
        }))
        res.json({ success: true, therapists: result })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/therapists/all — admin sees all including unverified
router.get('/all', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const therapists = await Therapist.find().populate('userId', 'name email')
        const result = therapists.map(t => ({
            id: t._id,
            userId: t.userId?._id,
            name: t.userId?.name || 'Unknown',
            email: t.userId?.email,
            specialization: t.specialization,
            bio: t.bio,
            licenseNumber: t.licenseNumber,
            universityName: t.universityName,
            verified: t.verified,
            isActive: t.isActive,
        }))
        res.json({ success: true, therapists: result })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/therapists/:id
router.get('/:id', async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.params.id).populate('userId', 'name email')
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found.' })
        res.json({ success: true, therapist })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// PUT /api/therapists/:id/verify — admin only
router.put('/:id/verify', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { action } = req.body // 'approve' | 'reject'
        const update = action === 'approve'
            ? { verified: true, isActive: true }
            : { verified: false, isActive: false }
        const therapist = await Therapist.findByIdAndUpdate(req.params.id, update, { new: true })
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found.' })
        res.json({ success: true, therapist })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/therapists/my/availability — therapist's own availability
router.get('/my/availability', verifyToken, requireRole('therapist'), async (req, res) => {
    try {
        const therapist = await Therapist.findOne({ userId: req.user.id })
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist profile not found.' })
        res.json({ success: true, availabilities: therapist.availability })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// POST /api/therapists/my/availability — add a slot
router.post('/my/availability', verifyToken, requireRole('therapist'), async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body
        if (!date || !startTime || !endTime) {
            return res.status(400).json({ success: false, error: 'date, startTime, and endTime are required.' })
        }

        const therapist = await Therapist.findOne({ userId: req.user.id })
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist profile not found.' })

        const slot = { date, startTime, endTime, isBooked: false }
        therapist.availability.push(slot)
        await therapist.save()

        const newSlot = therapist.availability[therapist.availability.length - 1]
        res.status(201).json({
            success: true,
            availability: {
                id: newSlot._id,
                date: newSlot.date,
                start_time: `${newSlot.date}T${newSlot.startTime}`,
                end_time: `${newSlot.date}T${newSlot.endTime}`,
                is_booked: newSlot.isBooked,
            }
        })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// DELETE /api/therapists/my/availability/:slotId — remove a slot
router.delete('/my/availability/:slotId', verifyToken, requireRole('therapist'), async (req, res) => {
    try {
        const therapist = await Therapist.findOne({ userId: req.user.id })
        if (!therapist) return res.status(404).json({ success: false, error: 'Therapist profile not found.' })

        const slot = therapist.availability.id(req.params.slotId)
        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found.' })
        if (slot.isBooked) return res.status(400).json({ success: false, error: 'Cannot delete a booked slot.' })

        slot.deleteOne()
        await therapist.save()
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
