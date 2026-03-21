import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['user', 'therapist', 'admin'], default: 'user' },
}, { timestamps: true })

// Index for fast lookups
userSchema.index({ email: 1, role: 1 })

// Instance method: compare password
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.passwordHash)
}

// Static method: hash password
userSchema.statics.hashPassword = function (password) {
    return bcrypt.hashSync(password, 10)
}

export default mongoose.model('User', userSchema)
