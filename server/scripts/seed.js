// ─── Seed Script: Create default accounts in MongoDB ───
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Therapist from '../models/Therapist.js'
import Report from '../models/Report.js'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healhive'

const seedUsers = [
    { name: 'Alex Morgan', email: 'user@healhive.com', password: 'user123', role: 'user' },
    { name: 'Dr. Sarah Chen', email: 'therapist@healhive.com', password: 'therapist123', role: 'therapist' },
    { name: 'Dr. James Miller', email: 'therapist2@healhive.com', password: 'therapist123', role: 'therapist' },
    { name: 'HealHive Admin', email: 'admin@healhive.com', password: 'admin123', role: 'admin' },
]

const therapistProfiles = [
    {
        email: 'therapist@healhive.com',
        specialization: 'Cognitive Behavioral Therapy',
        bio: 'Experienced therapist specializing in CBT for anxiety, depression, and stress management. 10+ years of clinical experience.',
        licenseNumber: 'LIC-2024-001',
        universityName: 'Stanford University',
        verified: true,
        isActive: true,
        availability: [
            { date: '2026-03-22', startTime: '09:00', endTime: '10:00', isBooked: false },
            { date: '2026-03-22', startTime: '10:30', endTime: '11:30', isBooked: false },
            { date: '2026-03-22', startTime: '14:00', endTime: '15:00', isBooked: false },
            { date: '2026-03-23', startTime: '09:00', endTime: '10:00', isBooked: false },
            { date: '2026-03-23', startTime: '11:00', endTime: '12:00', isBooked: false },
            { date: '2026-03-24', startTime: '10:00', endTime: '11:00', isBooked: false },
            { date: '2026-03-24', startTime: '15:00', endTime: '16:00', isBooked: false },
            { date: '2026-03-25', startTime: '09:00', endTime: '10:00', isBooked: false },
        ],
    },
    {
        email: 'therapist2@healhive.com',
        specialization: 'Family Therapy & Relationships',
        bio: 'Helping families and couples communicate and grow together. Specializing in conflict resolution and relationship counseling.',
        licenseNumber: 'LIC-2024-002',
        universityName: 'Harvard University',
        verified: true,
        isActive: true,
        availability: [
            { date: '2026-03-22', startTime: '10:00', endTime: '11:00', isBooked: false },
            { date: '2026-03-22', startTime: '13:00', endTime: '14:00', isBooked: false },
            { date: '2026-03-23', startTime: '14:00', endTime: '15:00', isBooked: false },
            { date: '2026-03-24', startTime: '09:00', endTime: '10:00', isBooked: false },
            { date: '2026-03-25', startTime: '11:00', endTime: '12:00', isBooked: false },
        ],
    },
]

const sampleReports = [
    {
        sessionId: 'seed-session-001',
        userMessage: 'I have been feeling very anxious lately, especially at work. I find it hard to concentrate and sometimes feel like everything is overwhelming.',
        therapistReport: 'Patient presents with generalized anxiety symptoms including difficulty concentrating, feeling overwhelmed, and work-related stress. PHQ-9 screening indicates mild-moderate anxiety. Recommend follow-up CBT sessions.',
        toolUsed: 'PHQ-9',
        score: 12,
        severity: 'Moderate',
        riskLevel: 'medium',
    },
    {
        sessionId: 'seed-session-002',
        userMessage: 'I feel sad most days and have lost interest in things I used to enjoy. Sleep has been difficult.',
        therapistReport: 'Patient displays symptoms consistent with moderate depressive episode. Loss of interest (anhedonia), persistent sadness, and sleep disturbance noted. GAD-7 assessment suggests co-occurring anxiety. Recommend therapeutic intervention.',
        toolUsed: 'GAD-7',
        score: 15,
        severity: 'Moderate',
        riskLevel: 'medium',
    },
    {
        sessionId: 'seed-session-003',
        userMessage: 'Things have been really tough. I sometimes wonder if things will ever get better.',
        therapistReport: 'Patient expressed hopelessness and existential concerns. While no active suicidal ideation detected, passive hopelessness warrants close monitoring. Safety plan discussed. Immediate follow-up recommended.',
        toolUsed: 'PHQ-9',
        score: 22,
        severity: 'Severe',
        riskLevel: 'high',
    },
    {
        sessionId: 'seed-session-004',
        userMessage: 'I wanted to share that I have been feeling better after our last session. The breathing exercises help.',
        therapistReport: 'Patient reports improvement in anxiety symptoms following CBT techniques. Breathing exercises showing positive effect. Continue current treatment plan.',
        toolUsed: 'PHQ-9',
        score: 5,
        severity: 'Minimal',
        riskLevel: 'low',
    },
]

async function seed() {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('Connected to MongoDB for seeding...')

        // Clear existing data
        await User.deleteMany({})
        await Therapist.deleteMany({})
        await Report.deleteMany({})
        console.log('Cleared existing data.')

        // Create users
        for (const u of seedUsers) {
            const existing = await User.findOne({ email: u.email })
            if (!existing) {
                const passwordHash = User.hashPassword(u.password)
                await User.create({ name: u.name, email: u.email, passwordHash, role: u.role })
                console.log(`  Created ${u.role}: ${u.email}`)
            }
        }

        // Create therapist profiles
        for (const tp of therapistProfiles) {
            const user = await User.findOne({ email: tp.email })
            if (user) {
                const existing = await Therapist.findOne({ userId: user._id })
                if (!existing) {
                    await Therapist.create({
                        userId: user._id,
                        specialization: tp.specialization,
                        bio: tp.bio,
                        licenseNumber: tp.licenseNumber,
                        universityName: tp.universityName,
                        verified: tp.verified,
                        isActive: tp.isActive,
                        availability: tp.availability,
                    })
                    console.log(`  Created therapist profile for: ${tp.email}`)
                }
            }
        }

        // Create sample reports
        for (const r of sampleReports) {
            await Report.create(r)
        }
        console.log(`  Created ${sampleReports.length} sample reports`)

        console.log('\n✅ Seed complete!')
        process.exit(0)
    } catch (err) {
        console.error('Seed error:', err)
        process.exit(1)
    }
}

seed()
