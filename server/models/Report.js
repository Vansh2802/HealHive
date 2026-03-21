import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
    sessionId:       { type: String, required: true },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    therapistId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userMessage:     { type: String, required: true },
    therapistReport: { type: String, required: true },
    toolUsed:        { type: String, default: null },
    score:           { type: Number, default: null },
    severity:        { type: String, default: null },
    riskLevel:       { type: String, enum: ['low', 'medium', 'high', null], default: null },
}, { timestamps: true })

reportSchema.index({ sessionId: 1 })
reportSchema.index({ severity: 1 })
reportSchema.index({ riskLevel: 1 })

export default mongoose.model('Report', reportSchema)
