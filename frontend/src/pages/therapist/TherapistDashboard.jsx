import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import DashboardLayout from '../../components/DashboardLayout'
import Skeleton from '../../components/Skeleton'
import TherapistReport from '../../components/TherapistReport'
import { fetchAvailability, createAvailability, deleteAvailability } from '../../services/api/availability'
import { getToken } from '../../services/api/auth'
import { fetchMySessions } from '../../services/api/sessions'
import {
    LayoutDashboard, Calendar, Clock, CheckCircle, Plus, X, Loader2,
    FileText, ChevronDown, ChevronUp, AlertTriangle, Video, Sparkles, Trash2,
    RefreshCw, AlertCircle
} from 'lucide-react'
import { fetchTherapistUpcomingSessions } from '../../services/api/sessions'

const navItems = [
    { path: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
]

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }
const IST_TIMEZONE = 'Asia/Kolkata'

// Task 5: Severities that are considered urgent
const URGENT_SEVERITIES = new Set(['EMERGENCY', 'CRITICAL'])

// Task 9: Unambiguous date format (e.g. "Apr 20, 2026")
function formatSlotDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: IST_TIMEZONE,
    })
}

// Task 9: Group slots by date
function groupSlotsByDate(slots) {
    const groups = {}
    for (const slot of slots) {
        const dateKey = formatSlotDate(slot.start_time)
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(slot)
    }
    return Object.entries(groups)
}

export default function TherapistDashboard() {
    const { user } = useAuth()
    const toast = useToast()
    const [tab, setTab] = useState('sessions')
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [reports, setReports] = useState([])
    const [reportsLoading, setReportsLoading] = useState(true)
    const [expandedReport, setExpandedReport] = useState(null)
    const [availability, setAvailability] = useState([])
    const [availabilityLoading, setAvailabilityLoading] = useState(false)
    const [showAddSlot, setShowAddSlot] = useState(false)
    // Task 9: recurring slot state
    const [showRecurring, setShowRecurring] = useState(false)
    const [recurringWeeks, setRecurringWeeks] = useState(4)
    const [slotStart, setSlotStart] = useState('')
    const [slotEnd, setSlotEnd] = useState('')
    const [slotError, setSlotError] = useState('')
    const [recurringLoading, setRecurringLoading] = useState(false)
    const [upcomingSessions, setUpcomingSessions] = useState([])
    const [upcomingSessionsLoading, setUpcomingSessionsLoading] = useState(true)

    useEffect(() => {
        if (!user?.id) return
        setAvailabilityLoading(true)
        fetchAvailability()
            .then(data => setAvailability(data))
            .catch(() => setAvailability([]))
            .finally(() => setAvailabilityLoading(false))
    }, [user?.id])

    useEffect(() => {
        if (!user?.id) return
        fetchMySessions('therapist')
            .then(data => setSessions(data))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false))
    }, [user?.id])

    useEffect(() => {
        if (!user?.id) return
        setUpcomingSessionsLoading(true)
        fetchTherapistUpcomingSessions()
            .then(data => setUpcomingSessions(data))
            .catch(() => setUpcomingSessions([]))
            .finally(() => setUpcomingSessionsLoading(false))
    }, [user?.id])

    useEffect(() => {
        const token = getToken()
        if (!token) return
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/realtime-chat/therapist/reports`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (d.success) setReports(d.reports || []) })
            .catch(() => {})
            .finally(() => setReportsLoading(false))
    }, [])

    const handleAddSlot = async () => {
        setSlotError('')
        if (!slotStart || !slotEnd) { setSlotError('Start and end required'); return }
        if (new Date(slotEnd) <= new Date(slotStart)) { setSlotError('End must be after start'); return }
        setAvailabilityLoading(true)
        const res = await createAvailability({ start_time: slotStart, end_time: slotEnd })
        if (res.success) {
            setAvailability(a => [...a, res.availability])
            setShowAddSlot(false)
            setSlotStart('')
            setSlotEnd('')
            toast.success('Availability slot added')
        } else {
            setSlotError(res.error || 'Error adding slot')
        }
        setAvailabilityLoading(false)
    }

    // Task 9: Add recurring weekly slots
    const handleAddRecurring = async () => {
        setSlotError('')
        if (!slotStart || !slotEnd) { setSlotError('Start and end required'); return }
        const startMs = new Date(slotStart).getTime()
        const endMs = new Date(slotEnd).getTime()
        if (endMs <= startMs) { setSlotError('End must be after start'); return }
        const weeks = Math.max(1, Math.min(12, parseInt(recurringWeeks) || 4))
        setRecurringLoading(true)
        const WEEK_MS = 7 * 24 * 60 * 60 * 1000
        const results = await Promise.allSettled(
            Array.from({ length: weeks }, (_, i) => {
                const newStart = new Date(startMs + i * WEEK_MS).toISOString().slice(0, 16)
                const newEnd = new Date(endMs + i * WEEK_MS).toISOString().slice(0, 16)
                return createAvailability({ start_time: newStart, end_time: newEnd })
            })
        )
        const created = results
            .filter(r => r.status === 'fulfilled' && r.value?.success)
            .map(r => r.value.availability)
        const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length
        if (created.length > 0) {
            setAvailability(a => [...a, ...created])
        }
        setShowRecurring(false)
        setShowAddSlot(false)
        setSlotStart('')
        setSlotEnd('')
        if (failed === 0) {
            toast.success(`${created.length} weekly slot${created.length !== 1 ? 's' : ''} added`)
        } else {
            toast.success(`${created.length} slots added, ${failed} skipped (may already exist)`)
        }
        setRecurringLoading(false)
    }

    const handleDeleteSlot = async (id) => {
        await deleteAvailability(id)
        setAvailability(a => a.filter(s => s.id !== id))
        toast.success('Slot deleted')
    }

    const handleJoinSession = (session) => {
        if (!session?.meeting_link) return
        window.open(session.meeting_link, '_blank', 'noopener,noreferrer')
    }

    const upcoming = sessions.filter(s => s.status === 'upcoming' || s.status === 'ongoing')
    const completed = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled')

    // Task 5: Count urgent reports (EMERGENCY or CRITICAL)
    const urgentCount = reports.filter(r => {
        const sev = r.severity_level || r?.report?.severity_level
        return URGENT_SEVERITIES.has(sev)
    }).length

    // Task 5: Sort reports — EMERGENCY first, then CRITICAL, then rest
    const SEVERITY_ORDER = { EMERGENCY: 0, CRITICAL: 1 }
    const sortedReports = [...reports].sort((a, b) => {
        const sevA = a.severity_level || a?.report?.severity_level || ''
        const sevB = b.severity_level || b?.report?.severity_level || ''
        const orderA = SEVERITY_ORDER[sevA] ?? 99
        const orderB = SEVERITY_ORDER[sevB] ?? 99
        return orderA - orderB
    })

    const tabs = [
        { key: 'sessions', label: 'Sessions', icon: Calendar },
        { key: 'availability', label: 'Availability', icon: Clock },
        {
            key: 'reports',
            label: 'Reports',
            icon: FileText,
            badge: urgentCount > 0 ? urgentCount : null,
        },
    ]

    return (
        <DashboardLayout navItems={navItems} title="Therapist Dashboard">
            {/* Welcome */}
            <motion.div {...fadeUp} className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    Welcome, <span className="text-sage-600">Dr. {user?.name?.split(' ')[0] || 'Therapist'}</span> 🌿
                </h2>
                <p className="text-slate-500 mt-1">Manage your sessions, availability, and reports.</p>
            </motion.div>

            {/* Mood Widget */}
            <motion.div {...fadeUp} transition={{ delay: 0.05 }}
                className="bg-gradient-to-r from-sage-50 to-lavender-50 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-sage-100/50">
                <Sparkles className="w-6 h-6 text-sage-500" />
                <div>
                    <p className="text-sm font-medium text-slate-700">Today's Insight</p>
                    <p className="text-xs text-slate-500">Remember to take a deep breath and care for yourself, too. 💚</p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-sage-600">{upcoming.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Upcoming</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{completed.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-lavender-600">{availability.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Slots</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-sage-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                        {/* Task 5: Urgent badge on Reports tab */}
                        {t.badge != null && (
                            <span className="relative flex items-center justify-center">
                                <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {t.badge}
                                </span>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Sessions Tab */}
            {tab === 'sessions' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div variants={stagger} initial="initial" animate="animate">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-sage-500" /> Upcoming ({upcoming.length})
                        </h3>
                        {loading ? <Skeleton height="h-24" count={2} /> : upcoming.length > 0 ? (
                            <div className="space-y-3">
                                {upcoming.map(s => (
                                    <motion.div key={s.id} variants={fadeUp}
                                        className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-slate-800">Patient Session</h4>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                s.status === 'ongoing' ? 'bg-amber-50 text-amber-700' : 'bg-sage-50 text-sage-700'
                                            }`}>{s.status}</span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-500 mb-3">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                                        </div>
                                        {(s.meeting_link && s.status === 'ongoing') && (
                                            <button onClick={() => handleJoinSession(s)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-lg transition-all">
                                                <Video className="w-4 h-4" /> Join Session
                                            </button>
                                        )}
                                        {(s.meeting_link && s.status === 'upcoming') && (
                                            <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium text-slate-500 bg-slate-100 flex items-center justify-center gap-2">
                                                <Clock className="w-4 h-4" /> Session starts at {s.time}
                                            </div>
                                        )}
                                        {!s.meeting_link && (
                                            <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium text-slate-400 bg-slate-50">
                                                Link unavailable
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">No upcoming sessions</p>
                                <p className="text-xs text-slate-400">Take a moment to relax.</p>
                            </div>
                        )}
                        </motion.div>

                        <motion.div variants={stagger} initial="initial" animate="animate">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> History ({completed.length})
                        </h3>
                        {completed.length > 0 ? (
                            <div className="space-y-3">
                                {completed.map(s => (
                                    <motion.div key={s.id} variants={fadeUp}
                                        className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800">Patient Session</h4>
                                                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                    <span>{s.date}</span><span>{s.time}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                s.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>{s.status}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                                <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">No completed sessions yet.</p>
                            </div>
                        )}
                        </motion.div>
                    </div>

                    <motion.div variants={stagger} initial="initial" animate="animate" className="mt-8">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-500" /> Booked Sessions ({upcomingSessions.length})
                        </h3>
                        {upcomingSessions.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {upcomingSessions.map(s => {
                                    const sessionTime = new Date(s.session_time)
                                    const sessionDate = sessionTime.toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: IST_TIMEZONE,
                                    })
                                    const sessionTimeStr = sessionTime.toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: IST_TIMEZONE,
                                    })
                                    return (
                                        <motion.div key={s.id} variants={fadeUp}
                                            className="bg-gradient-to-br from-blue-50 to-blue-0 rounded-2xl border border-blue-200 p-5 hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-slate-800">{s.patient_name}</h4>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                    s.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                                    s.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-3 text-xs text-slate-500 mb-3">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sessionDate}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sessionTimeStr}</span>
                                            </div>
                                            {(s.meeting_link && s.status === 'ongoing') && (
                                                <button onClick={() => window.open(s.meeting_link, '_blank', 'noopener,noreferrer')}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-lg transition-all active:scale-95">
                                                    <Video className="w-4 h-4" /> Join Session
                                                </button>
                                            )}
                                            {(s.meeting_link && s.status === 'upcoming') && (
                                                <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium text-blue-600 bg-blue-50/50 flex items-center justify-center gap-2 border border-blue-100">
                                                    <Clock className="w-4 h-4" /> Session starts at {sessionTimeStr}
                                                </div>
                                            )}
                                            {!s.meeting_link && (
                                                <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
                                                    Meet link unavailable
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : upcomingSessionsLoading ? (
                            <Skeleton height="h-24" count={2} />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                                <Video className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">No booked sessions yet</p>
                                <p className="text-xs text-slate-400">Bookings will appear here automatically</p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}

            {/* Availability Tab */}
            {tab === 'availability' && (
                <motion.div variants={stagger} initial="initial" animate="animate">
                    {/* Task 9: Header with two buttons */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sage-500" /> Your Slots
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowRecurring(false); setShowAddSlot(!showAddSlot); setSlotError('') }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-lg transition-all">
                                <Plus className="w-4 h-4" /> Add Slot
                            </button>
                            <button onClick={() => { setShowAddSlot(!showAddSlot); setShowRecurring(true); setSlotError('') }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-sage-700 bg-sage-50 border border-sage-200 hover:bg-sage-100 transition-all">
                                <RefreshCw className="w-4 h-4" /> Repeat Weekly
                            </button>
                        </div>
                    </div>

                    {showAddSlot && (
                        <motion.div {...fadeUp} className="bg-white rounded-2xl border border-sage-200 p-5 mb-6">
                            <p className="text-sm font-medium text-slate-700 mb-3">
                                {showRecurring ? 'Add Recurring Weekly Slot' : 'Add Single Slot'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                    <input type="datetime-local" value={slotStart} onChange={e => setSlotStart(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sage-100 focus:border-sage-400 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                    <input type="datetime-local" value={slotEnd} onChange={e => setSlotEnd(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sage-100 focus:border-sage-400 outline-none transition-all" />
                                </div>
                            </div>
                            {/* Task 9: Recurring weeks selector */}
                            {showRecurring && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Repeat for how many weeks? <span className="text-sage-600 font-bold">{recurringWeeks}</span>
                                    </label>
                                    <input type="range" min={1} max={12} value={recurringWeeks}
                                        onChange={e => setRecurringWeeks(e.target.value)}
                                        className="w-full accent-sage-600" />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>1 week</span><span>12 weeks</span>
                                    </div>
                                </div>
                            )}
                            {slotError && <p className="text-xs text-red-600 mb-3">{slotError}</p>}
                            <div className="flex gap-2">
                                {showRecurring ? (
                                    <button onClick={handleAddRecurring} disabled={recurringLoading}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sage-600 hover:bg-sage-700 transition-all flex items-center gap-2 disabled:opacity-60">
                                        {recurringLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Save {recurringWeeks} Slots
                                    </button>
                                ) : (
                                    <button onClick={handleAddSlot}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sage-600 hover:bg-sage-700 transition-all">Save</button>
                                )}
                                <button onClick={() => { setShowAddSlot(false); setSlotError(''); setShowRecurring(false) }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    )}

                    {availabilityLoading ? <Skeleton height="h-16" count={3} /> : availability.length > 0 ? (
                        /* Task 9: Group by date */
                        <div className="space-y-6">
                            {groupSlotsByDate(availability).map(([dateLabel, slots]) => (
                                <div key={dateLabel}>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-sage-400" /> {dateLabel}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {slots.map(slot => (
                                            <motion.div key={slot.id} variants={fadeUp}
                                                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-sage-500" />
                                                    <div>
                                                        {/* Task 9: Time only (date is shown as header) */}
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {new Date(slot.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: IST_TIMEZONE })}
                                                            {' '}–{' '}
                                                            {new Date(slot.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: IST_TIMEZONE })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Task 9: Booked = sky blue (informational), Available = emerald */}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${slot.is_booked ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                        {slot.is_booked ? 'Booked' : 'Available'}
                                                    </span>
                                                    {!slot.is_booked && (
                                                        <button onClick={() => handleDeleteSlot(slot.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 mb-1">No availability set</p>
                            <p className="text-xs text-slate-400">Add slots so patients can book sessions.</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Reports Tab */}
            {tab === 'reports' && (
                <motion.div variants={stagger} initial="initial" animate="animate">
                    {/* Task 5: Urgent banner when urgent reports exist */}
                    {urgentCount > 0 && !reportsLoading && (
                        <motion.div {...fadeUp}
                            className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />
                            <p className="text-sm font-semibold text-red-700">
                                {urgentCount} urgent report{urgentCount !== 1 ? 's' : ''} require{urgentCount === 1 ? 's' : ''} immediate attention
                            </p>
                        </motion.div>
                    )}
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-lavender-500" /> Assessment Reports
                        {urgentCount > 0 && (
                            <span className="ml-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                {urgentCount} urgent
                            </span>
                        )}
                    </h3>
                    {reportsLoading ? <Skeleton height="h-16" count={3} /> : reports.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 mb-1">No reports yet</p>
                            <p className="text-xs text-slate-400">Reports appear after chatbot assessments.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedReports.map(r => {
                                const isExpanded = expandedReport === r.id
                                const severity = r.severity_level || r?.report?.severity_level
                                const isUrgent = URGENT_SEVERITIES.has(severity)
                                const sevColors = {
                                    LOW: 'bg-emerald-50 text-emerald-700',
                                    MEDIUM: 'bg-amber-50 text-amber-700',
                                    HIGH: 'bg-orange-50 text-orange-700',
                                    SEVERE: 'bg-red-50 text-red-700',
                                    CRITICAL: 'bg-red-100 text-red-800',
                                    EMERGENCY: 'bg-red-200 text-red-900',
                                }
                                return (
                                    <motion.div key={r.id} variants={fadeUp}
                                        className={`rounded-2xl overflow-hidden transition-all ${
                                            isUrgent
                                                ? 'border-2 border-red-400 shadow-md shadow-red-100 bg-white'
                                                : 'border border-slate-100 bg-white hover:shadow-md'
                                        }`}>
                                        {/* Task 5: Urgent top-bar indicator */}
                                        {isUrgent && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500">
                                                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                                <span className="text-xs font-bold text-white tracking-wide">
                                                    URGENT — {severity} RISK — Immediate Review Required
                                                </span>
                                                <span className="ml-auto flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                </span>
                                            </div>
                                        )}
                                        <button onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded">
                                                        {r.anonymous_user_id || 'ANON-UNKNOWN'}
                                                    </span>
                                                    {severity && (
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${sevColors[severity] || 'bg-slate-50 text-slate-700'}`}>
                                                            {severity}
                                                        </span>
                                                    )}
                                                    {r.severity_score != null && <span className="text-xs text-slate-500">Score: {r.severity_score}</span>}
                                                    {(severity === 'SEVERE' || isUrgent) && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(r.created_at || r.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </button>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">Clinical Report</p>
                                                <TherapistReport reportData={r} viewer="therapist" />
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            )}
        </DashboardLayout>
    )
}
