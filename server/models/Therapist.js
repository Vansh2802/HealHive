import mongoose from 'mongoose'

const availabilitySlotSchema = new mongoose.Schema({
    date:      { type: String, required: true },           // e.g. '2026-03-25'
    startTime: { type: String, required: true },           // e.g. '09:00'
    endTime:   { type: String, required: true },           // e.g. '10:00'
    isBooked:  { type: Boolean, default: false },
}, { _id: true })

const therapistSchema = new mongoose.Schema({
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, default: '' },
    bio:            { type: String, default: '' },
    licenseNumber:  { type: String, default: '' },
    universityName: { type: String, default: '' },
    verified:       { type: Boolean, default: false },
    isActive:       { type: Boolean, default: false },
    availability:   [availabilitySlotSchema],
}, { timestamps: true })

therapistSchema.index({ userId: 1 })
therapistSchema.index({ verified: 1, isActive: 1 })

export default mongoose.model('Therapist', therapistSchema)
