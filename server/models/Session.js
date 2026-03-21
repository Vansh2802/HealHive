import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:        { type: String, required: true },
    time:        { type: String, required: true },
    meetingLink: { type: String, default: '' },
    status:      { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
}, { timestamps: true })

sessionSchema.index({ userId: 1, status: 1 })
sessionSchema.index({ therapistId: 1, status: 1 })
sessionSchema.index({ date: 1 })

export default mongoose.model('Session', sessionSchema)
