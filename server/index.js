// ─── HealHive API Server (MongoDB) ───
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

// Route imports
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import therapistRoutes from './routes/therapists.js'
import sessionRoutes from './routes/sessions.js'
import chatRoutes from './routes/chat.js'
import reportRoutes from './routes/reports.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 4000

// Socket.io setup
const io = new SocketServer(server, {
    cors: { origin: 'http://localhost:5173', credentials: true }
})

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'HealHive API', database: 'MongoDB' }))

// Mount routes
app.use('/api', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/therapists', therapistRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/admin', adminRoutes)

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id)

    socket.on('join-chat', (sessionId) => {
        socket.join(sessionId)
    })

    socket.on('chat-message', (data) => {
        io.to(data.sessionId).emit('new-message', data)
    })

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id)
    })
})

// Connect to MongoDB then start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 HealHive API running on http://localhost:${PORT}`)
    })
})
