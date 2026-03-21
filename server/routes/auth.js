// ─── Auth Routes (MongoDB) ───
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Therapist from '../models/Therapist.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'healhive_secret_key_change_in_prod'
const JWT_EXPIRES = '7d'

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Email, password and role are required.' })
        }

        const user = await User.findOne({ email: email.toLowerCase(), role })
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials or wrong role selected.' })
        }

        if (!user.comparePassword(password)) {
            return res.status(401).json({ success: false, error: 'Incorrect password.' })
        }

        // Therapists must be approved before login
        if (role === 'therapist') {
            const profile = await Therapist.findOne({ userId: user._id })
            if (!profile || !profile.verified) {
                return res.status(403).json({
                    success: false,
                    error: 'Your therapist account is pending verification. Please wait for admin approval.',
                    pendingVerification: true,
                })
            }
        }

        const payload = { id: user._id, name: user.name, email: user.email, role: user.role }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })

        res.json({ success: true, token, user: payload })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, specialization, bio, licenseNumber, universityName } = req.body
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, error: 'All fields are required.' })
        }

        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists.' })
        }

        const passwordHash = User.hashPassword(password)
        const user = await User.create({ name, email, passwordHash, role })

        // If registering as therapist, create therapist profile
        if (role === 'therapist') {
            await Therapist.create({
                userId: user._id,
                specialization: specialization || '',
                bio: bio || '',
                licenseNumber: licenseNumber || '',
                universityName: universityName || '',
            })
        }

        const payload = { id: user._id, name: user.name, email: user.email, role: user.role }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })

        res.status(201).json({ success: true, token, user: payload })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash')
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' })
        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' })
    }
})

export default router
