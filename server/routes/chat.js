// ─── Chat Routes ───
import { Router } from 'express'
import Chat from '../models/Chat.js'

const router = Router()

// POST /api/chat/message — anonymous chatbot message
router.post('/message', async (req, res) => {
    try {
        const { message, sessionId, history } = req.body
        if (!message || !sessionId) {
            return res.status(400).json({ success: false, error: 'message and sessionId are required.' })
        }

        // Save user message to DB
        let chat = await Chat.findOne({ sessionId })
        if (!chat) {
            chat = await Chat.create({
                sessionId,
                participants: ['anonymous', 'bot'],
                messages: [],
            })
        }

        chat.messages.push({ sender: 'user', text: message })

        // Simple AI response (in production, integrate with AI API)
        const responses = [
            "I hear you. Thank you for sharing that with me. Can you tell me more about how that makes you feel?",
            "That sounds really challenging. It's completely valid to feel that way. What do you think would help you feel a bit better right now?",
            "I appreciate you opening up about this. Remember, it's okay to take things one step at a time. What's been on your mind the most today?",
            "Thank you for trusting me with this. Everyone's journey is different, and you're doing great by reaching out. Would you like to explore this feeling further?",
            "I understand. Sometimes just talking about it can be a relief. Is there anything specific you'd like guidance or support with?",
            "Your feelings are completely valid. It takes courage to talk about these things. What would you like to focus on in our conversation?",
        ]
        const reply = responses[Math.floor(Math.random() * responses.length)]

        chat.messages.push({ sender: 'bot', text: reply })
        await chat.save()

        res.json({ success: true, reply })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Chat service error.' })
    }
})

// GET /api/chat/:sessionId — get chat history
router.get('/:sessionId', async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId })
        if (!chat) return res.json({ success: true, messages: [] })
        res.json({ success: true, messages: chat.messages })
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error.' })
    }
})

export default router
