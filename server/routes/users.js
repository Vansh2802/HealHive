// ─── User Routes ───
import { Router } from 'express'
import User from '../models/User.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/users — admin only
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 })
        res.json({ success: true, users })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash')
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' })
        res.json({ success: true, user })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
