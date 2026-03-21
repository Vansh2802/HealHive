// ─── Admin Routes ───
import { Router } from 'express'
import User from '../models/User.js'
import Therapist from '../models/Therapist.js'
import Session from '../models/Session.js'
import Report from '../models/Report.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/dashboard — aggregated stats
router.get('/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const [
            totalUsers,
            totalTherapists,
            activeTherapists,
            pendingVerifications,
            totalSessions,
            scheduledSessions,
            completedSessions,
            totalReports,
            highRiskCount,
            recentUsers,
            recentSessions,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'therapist' }),
            Therapist.countDocuments({ verified: true, isActive: true }),
            Therapist.countDocuments({ verified: false }),
            Session.countDocuments(),
            Session.countDocuments({ status: 'scheduled' }),
            Session.countDocuments({ status: 'completed' }),
            Report.countDocuments(),
            Report.countDocuments({ riskLevel: 'high' }),
            User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(10).select('-passwordHash'),
            Session.find().sort({ createdAt: -1 }).limit(10)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email'),
        ])

        // High-risk reports as flags
        const flags = await Report.find({ riskLevel: { $in: ['high', 'medium'] } })
            .sort({ createdAt: -1 }).limit(20)
        const mappedFlags = flags.map(r => ({
            id: r._id,
            severity: r.riskLevel === 'high' ? 'high' : 'medium',
            status: 'unreviewed',
            reason: `${r.severity || 'Unknown'} severity assessment detected`,
            snippet: r.userMessage?.slice(0, 200) || '',
            chatSessionId: r.sessionId,
            timestamp: r.createdAt,
        }))

        res.json({
            success: true,
            metrics: {
                totalUsers,
                totalTherapists,
                activeTherapists,
                pendingVerifications,
                totalSessions,
                scheduledSessions,
                completedSessions,
                totalReports,
                highRiskFlags: highRiskCount,
                avgSessionRating: 4.6,  // placeholder
            },
            flags: mappedFlags,
            recentUsers,
            recentSessions: recentSessions.map(s => ({
                id: s._id,
                userName: s.userId?.name || 'Unknown',
                therapistName: s.therapistId?.name || 'Unknown',
                date: s.date,
                time: s.time,
                status: s.status,
            })),
        })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/admin/users — all users
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 })
        res.json({ success: true, users })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/admin/sessions — all sessions
router.get('/sessions', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const sessions = await Session.find()
            .populate('userId', 'name email')
            .populate('therapistId', 'name email')
            .sort({ createdAt: -1 })
        res.json({ success: true, sessions })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
