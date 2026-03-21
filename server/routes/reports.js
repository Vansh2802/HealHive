// ─── Report Routes (MongoDB) ───
import { Router } from 'express'
import Report from '../models/Report.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/reports — save a report (anonymous chatbot creates these)
router.post('/', async (req, res) => {
    try {
        const { sessionId, userMessage, therapistReport, toolUsed, score, severity, riskLevel } = req.body
        if (!sessionId || !userMessage || !therapistReport) {
            return res.status(400).json({ success: false, error: 'sessionId, userMessage, and therapistReport are required.' })
        }

        const report = await Report.create({
            sessionId,
            userMessage,
            therapistReport,
            toolUsed: toolUsed || null,
            score: score || null,
            severity: severity || null,
            riskLevel: riskLevel || null,
        })

        res.status(201).json({ success: true, reportId: report._id })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/reports — therapists and admins only
router.get('/', verifyToken, requireRole('therapist', 'admin'), async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 }).limit(100)
        res.json({ success: true, reports })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

// GET /api/reports/:id — individual report
router.get('/:id', verifyToken, requireRole('therapist', 'admin'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
        if (!report) return res.status(404).json({ success: false, error: 'Report not found.' })
        res.json({ success: true, report })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
