// ─── HealHive API Server (MongoDB) ───
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

// Route imports
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import therapistRoutes from './routes/therapists.js'
import sessionRoutes from './routes/sessions.js'
import reportRoutes from './routes/reports.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 4000

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'HealHive API', database: 'MongoDB' }))

// Mount routes
app.use('/api', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/therapists', therapistRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/admin', adminRoutes)

// Connect to MongoDB then start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 HealHive API running on http://localhost:${PORT}`)
    })
})
