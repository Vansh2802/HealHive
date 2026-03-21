import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    sender:    { type: String, required: true },  // 'user' | 'bot' | ObjectId
    text:      { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
})

const chatSchema = new mongoose.Schema({
    sessionId:    { type: String, required: true, unique: true },
    participants: [{ type: String }],  // e.g. ['anonymous', 'bot']
    messages:     [messageSchema],
}, { timestamps: true })

chatSchema.index({ sessionId: 1 })

export default mongoose.model('Chat', chatSchema)
