import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import DashboardLayout from '../../components/DashboardLayout'
import EmptyState from '../../components/EmptyState'
import SettingsPage from '../../components/SettingsPage'
import Skeleton from '../../components/Skeleton'
import TherapistReport from '../../components/TherapistReport'
import { fetchAvailability, createAvailability, deleteAvailability } from '../../services/api/availability'
import { getToken } from '../../services/api/auth'
import { fetchMySessions } from '../../services/api/sessions'
import {
    LayoutDashboard, Calendar, Clock, CheckCircle, Plus, X, Loader2,
    FileText, ChevronDown, ChevronUp, AlertTriangle, Video, Sparkles, Trash2,
    RefreshCw, AlertCircle, Settings
} from 'lucide-react'
import { fetchTherapistUpcomingSessions } from '../../services/api/sessions'

const navItems = [
    { path: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/therapist/dashboard?tab=sessions', label: 'Sessions', icon: Calendar },
    { path: '/therapist/dashboard?tab=availability', label: 'Availability', icon: Clock },
    { path: '/therapist/dashboard?tab=reports', label: 'Reports', icon: FileText },
    { path: '/therapist/dashboard?tab=settings', label: 'Settings', icon: Settings },
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
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || 'dashboard'
    const setTab = (key) => {
        if (key === 'dashboard') {
            setSearchParams({})
        } else {
            setSearchParams({ tab: key })
        }
    }

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

            {/* Settings tab */}
            {tab === 'settings' && <SettingsPage />}

            {/* Dashboard / main view */}
            {(tab === 'dashboard' || tab === 'sessions' || tab === 'availability' || tab === 'reports') && (
                <>
                    {/* Welcome */}
                    <motion.div {...fadeUp} className="mb-6">
                        <h2 className="text-2xl font-semibold"
                            style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)' }}>
                            Welcome, <span style={{ color: 'var(--color-primary)' }}>Dr. {user?.name?.split(' ')[0] || 'Therapist'}</span> 🌿
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-outline)' }}>
                            Manage your sessions, availability, and reports.
                        </p>
                    </motion.div>

                    {/* Mood Widget */}
                    <motion.div {...fadeUp} transition={{ delay: 0.05 }}
                        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-surface-container-low), var(--color-surface-container))',
                            border: '1px solid rgba(191,201,193,0.18)',
                        }}>
                        <Sparkles style={{ width: 22, height: 22, color: 'var(--color-primary)', flexShrink: 0 }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>Today's Insight</p>
                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                                Remember to take a deep breath and care for yourself, too. 💚
                            </p>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-6">
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: 'var(--color-primary)' }}>{upcoming.length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Upcoming</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: '#059669' }}>{completed.length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Completed</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: '#7c3aed' }}>{availability.length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Slots</p>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className="dashboard-tab-group mb-6">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`dashboard-tab ${tab === t.key || (tab === 'dashboard' && t.key === 'sessions') ? 'active' : ''}`}>
                                <t.icon style={{ width: 14, height: 14 }} />
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
                    {(tab === 'sessions' || tab === 'dashboard') && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <motion.div variants={stagger} initial="initial" animate="animate">
                                    <h3 className="dashboard-section-header">
                                        <Calendar style={{ width: 15, height: 15, color: 'var(--color-primary)' }} /> Upcoming ({upcoming.length})
                                    </h3>
                                    {loading ? <Skeleton height="h-24" count={2} /> : upcoming.length > 0 ? (
                                        <div className="space-y-3">
                                            {upcoming.map(s => (
                                                <motion.div key={s.id} variants={fadeUp} className="session-card">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>Patient Session</h4>
                                                        <span className={`badge ${s.status === 'ongoing' ? 'badge-amber' : 'badge-sage'} capitalize`}>{s.status}</span>
                                                    </div>
                                                    <div className="flex gap-3 text-xs mb-3" style={{ color: 'var(--color-outline)' }}>
                                                        <span className="flex items-center gap-1"><Calendar style={{ width: 12, height: 12 }} />{s.date}</span>
                                                        <span className="flex items-center gap-1"><Clock style={{ width: 12, height: 12 }} />{s.time}</span>
                                                    </div>
                                                    {(s.meeting_link && s.status === 'ongoing') && (
                                                        <button onClick={() => handleJoinSession(s)} className="btn-join">
                                                            <Video style={{ width: 16, height: 16 }} /> Join Session
                                                        </button>
                                                    )}
                                                    {(s.meeting_link && s.status === 'upcoming') && (
                                                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-2"
                                                             style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-outline)' }}>
                                                            <Clock style={{ width: 16, height: 16 }} /> Session starts at {s.time}
                                                        </div>
                                                    )}
                                                    {!s.meeting_link && (
                                                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium"
                                                             style={{ background: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                                            Link unavailable
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={Calendar}
                                            message="No upcoming sessions"
                                            subtext="Enjoy the calm — your schedule is clear."
                                        />
                                    )}
                                </motion.div>

                                <motion.div variants={stagger} initial="initial" animate="animate">
                                    <h3 className="dashboard-section-header">
                                        <CheckCircle style={{ width: 15, height: 15, color: '#059669' }} /> History ({completed.length})
                                    </h3>
                                    {completed.length > 0 ? (
                                        <div className="space-y-3">
                                            {completed.map(s => (
                                                <motion.div key={s.id} variants={fadeUp} className="session-card">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>Patient Session</h4>
                                                            <div className="flex gap-3 text-xs mt-1" style={{ color: 'var(--color-outline)' }}>
                                                                <span>{s.date}</span><span>{s.time}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`badge ${s.status === 'cancelled' ? 'badge-red' : 'badge-emerald'} capitalize`}>{s.status}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={CheckCircle}
                                            message="No completed sessions yet"
                                            subtext="Completed sessions will appear here as your patients progress."
                                        />
                                    )}
                                </motion.div>
                            </div>

                            <motion.div variants={stagger} initial="initial" animate="animate" className="mt-8">
                                <h3 className="dashboard-section-header">
                                    <Video style={{ width: 15, height: 15, color: '#3b82f6' }} /> Booked Sessions ({upcomingSessions.length})
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
                                                <motion.div key={s.id} variants={fadeUp} className="session-card"
                                                    style={{ borderColor: 'rgba(59,130,246,0.18)' }}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{s.patient_name}</h4>
                                                        <span className={`badge ${
                                                            s.status === 'upcoming' ? 'badge-sage' :
                                                            s.status === 'ongoing' ? 'badge-amber' :
                                                            'badge-emerald'
                                                        } capitalize`}>
                                                            {s.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-3 text-xs mb-3" style={{ color: 'var(--color-outline)' }}>
                                                        <span className="flex items-center gap-1"><Calendar style={{ width: 12, height: 12 }} />{sessionDate}</span>
                                                        <span className="flex items-center gap-1"><Clock style={{ width: 12, height: 12 }} />{sessionTimeStr}</span>
                                                    </div>
                                                    {(s.meeting_link && s.status === 'ongoing') && (
                                                        <button onClick={() => window.open(s.meeting_link, '_blank', 'noopener,noreferrer')}
                                                            className="btn-join">
                                                            <Video style={{ width: 16, height: 16 }} /> Join Session
                                                        </button>
                                                    )}
                                                    {(s.meeting_link && s.status === 'upcoming') && (
                                                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-2"
                                                             style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-outline)', border: '1px solid rgba(191,201,193,0.15)' }}>
                                                            <Clock style={{ width: 16, height: 16 }} /> Session starts at {sessionTimeStr}
                                                        </div>
                                                    )}
                                                    {!s.meeting_link && (
                                                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium"
                                                             style={{ background: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
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
                                    <EmptyState
                                        icon={Video}
                                        message="No booked sessions yet"
                                        subtext="Bookings will appear here as patients schedule with you."
                                    />
                                )}
                            </motion.div>
                        </>
                    )}

                    {/* Availability Tab */}
                    {tab === 'availability' && (
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            {/* Task 9: Header with two buttons */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <h3 className="dashboard-section-header" style={{ marginBottom: 0 }}>
                                    <Clock style={{ width: 15, height: 15, color: 'var(--color-primary)' }} /> Your Slots
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { setShowRecurring(false); setShowAddSlot(!showAddSlot); setSlotError('') }}
                                        className="btn-primary flex items-center gap-1.5"
                                        style={{ padding: '8px 16px', fontSize: '13px' }}>
                                        <Plus style={{ width: 16, height: 16 }} /> Add Slot
                                    </button>
                                    <button onClick={() => { setShowAddSlot(!showAddSlot); setShowRecurring(true); setSlotError('') }}
                                        className="btn-secondary flex items-center gap-1.5"
                                        style={{ padding: '8px 16px', fontSize: '13px' }}>
                                        <RefreshCw style={{ width: 16, height: 16 }} /> Repeat Weekly
                                    </button>
                                </div>
                            </div>

                            {showAddSlot && (
                                <motion.div {...fadeUp} className="session-card p-5 mb-6">
                                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-on-surface)' }}>
                                        {showRecurring ? 'Add Recurring Weekly Slot' : 'Add Single Slot'}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Start Time</label>
                                            <input type="datetime-local" value={slotStart} onChange={e => setSlotStart(e.target.value)}
                                                className="input-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>End Time</label>
                                            <input type="datetime-local" value={slotEnd} onChange={e => setSlotEnd(e.target.value)}
                                                className="input-primary" />
                                        </div>
                                    </div>
                                    {/* Task 9: Recurring weeks selector */}
                                    {showRecurring && (
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                                Repeat for how many weeks? <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{recurringWeeks}</span>
                                            </label>
                                            <input type="range" min={1} max={12} value={recurringWeeks}
                                                onChange={e => setRecurringWeeks(e.target.value)}
                                                className="w-full" style={{ accentColor: 'var(--color-primary)' }} />
                                            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-outline)' }}>
                                                <span>1 week</span><span>12 weeks</span>
                                            </div>
                                        </div>
                                    )}
                                    {slotError && <p className="text-xs mb-3" style={{ color: 'var(--color-error)' }}>{slotError}</p>}
                                    <div className="flex gap-2">
                                        {showRecurring ? (
                                            <button onClick={handleAddRecurring} disabled={recurringLoading}
                                                className="btn-primary flex items-center gap-2"
                                                style={{ padding: '10px 20px', fontSize: '13px' }}>
                                                {recurringLoading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                                                Save {recurringWeeks} Slots
                                            </button>
                                        ) : (
                                            <button onClick={handleAddSlot}
                                                className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Save</button>
                                        )}
                                        <button onClick={() => { setShowAddSlot(false); setSlotError(''); setShowRecurring(false) }}
                                            className="btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }}>Cancel</button>
                                    </div>
                                </motion.div>
                            )}

                            {availabilityLoading ? <Skeleton height="h-16" count={3} /> : availability.length > 0 ? (
                                /* Task 9: Group by date */
                                <div className="space-y-6">
                                    {groupSlotsByDate(availability).map(([dateLabel, slots]) => (
                                        <div key={dateLabel}>
                                            <h4 className="dashboard-section-header" style={{ marginBottom: 8 }}>
                                                <Calendar style={{ width: 14, height: 14, color: 'var(--color-primary-container)' }} /> {dateLabel}
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {slots.map(slot => (
                                                    <motion.div key={slot.id} variants={fadeUp}
                                                        className="session-card p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Clock style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                                                            <div>
                                                                {/* Task 9: Time only (date is shown as header) */}
                                                                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                                                    {new Date(slot.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: IST_TIMEZONE })}
                                                                    {' '}–{' '}
                                                                    {new Date(slot.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: IST_TIMEZONE })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {/* Task 9: Booked = sky blue (informational), Available = emerald */}
                                                            <span className={`badge ${slot.is_booked ? 'badge-amber' : 'badge-emerald'}`}>
                                                                {slot.is_booked ? 'Booked' : 'Available'}
                                                            </span>
                                                            {!slot.is_booked && (
                                                                <button onClick={() => handleDeleteSlot(slot.id)}
                                                                    className="p-1.5 rounded-lg transition-all"
                                                                    style={{ color: 'var(--color-outline)' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.color = '#991b1b'; e.currentTarget.style.background = 'rgba(186,26,26,0.06)' }}
                                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-outline)'; e.currentTarget.style.background = 'transparent' }}>
                                                                    <Trash2 style={{ width: 14, height: 14 }} />
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
                                <EmptyState
                                    icon={Clock}
                                    message="No availability set"
                                    subtext="Add slots so patients can book sessions with you."
                                    ctaLabel="Add a slot"
                                    ctaOnClick={() => { setShowAddSlot(true); setShowRecurring(false); setSlotError('') }}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* Reports Tab */}
                    {tab === 'reports' && (
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            {/* Task 5: Urgent banner when urgent reports exist */}
                            {urgentCount > 0 && !reportsLoading && (
                                <motion.div {...fadeUp}
                                    className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.18)' }}>
                                    <AlertCircle style={{ width: 20, height: 20, color: 'var(--color-error)', flexShrink: 0 }} className="animate-pulse" />
                                    <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>
                                        {urgentCount} urgent report{urgentCount !== 1 ? 's' : ''} require{urgentCount === 1 ? 's' : ''} immediate attention
                                    </p>
                                </motion.div>
                            )}
                            <h3 className="dashboard-section-header">
                                <FileText style={{ width: 15, height: 15, color: '#7c3aed' }} /> Assessment Reports
                                {urgentCount > 0 && (
                                    <span className="badge badge-red" style={{ marginLeft: 4, fontSize: 10 }}>
                                        {urgentCount} urgent
                                    </span>
                                )}
                            </h3>
                            {reportsLoading ? <Skeleton height="h-16" count={3} /> : reports.length === 0 ? (
                                <EmptyState
                                    icon={FileText}
                                    message="No reports yet"
                                    subtext="Reports will appear here after chatbot assessments."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {sortedReports.map(r => {
                                        const isExpanded = expandedReport === r.id
                                        const severity = r.severity_level || r?.report?.severity_level
                                        const isUrgent = URGENT_SEVERITIES.has(severity)
                                        const sevColors = {
                                            LOW: 'badge-emerald',
                                            MEDIUM: 'badge-amber',
                                            HIGH: 'badge-amber',
                                            SEVERE: 'badge-red',
                                            CRITICAL: 'badge-red',
                                            EMERGENCY: 'badge-red',
                                        }
                                        return (
                                            <motion.div key={r.id} variants={fadeUp}
                                                className={`session-card overflow-hidden ${isUrgent ? '' : ''}`}
                                                style={isUrgent ? { borderColor: 'rgba(186,26,26,0.35)', boxShadow: '0 4px 16px rgba(186,26,26,0.08)' } : {}}>
                                                {/* Task 5: Urgent top-bar indicator */}
                                                {isUrgent && (
                                                    <div className="flex items-center gap-2 px-4 py-2 -mx-5 -mt-5 mb-4"
                                                         style={{ background: 'var(--color-error)', marginLeft: '-20px', marginRight: '-20px', marginTop: '-20px' }}>
                                                        <AlertTriangle style={{ width: 14, height: 14, color: '#fff' }} />
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
                                                    className="w-full flex items-center gap-3 text-left">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="badge" style={{ background: 'rgba(196,181,253,0.18)', color: '#6d28d9', border: '1px solid rgba(196,181,253,0.30)', fontSize: 11 }}>
                                                                {r.anonymous_user_id || 'ANON-UNKNOWN'}
                                                            </span>
                                                            {severity && (
                                                                <span className={`badge ${sevColors[severity] || 'badge-sage'}`} style={{ fontSize: 11 }}>
                                                                    {severity}
                                                                </span>
                                                            )}
                                                            {r.severity_score != null && <span className="text-xs" style={{ color: 'var(--color-outline)' }}>Score: {r.severity_score}</span>}
                                                            {(severity === 'SEVERE' || isUrgent) && <AlertTriangle style={{ width: 14, height: 14, color: 'var(--color-error)' }} />}
                                                        </div>
                                                        <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>
                                                            {new Date(r.created_at || r.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {isExpanded
                                                        ? <ChevronUp style={{ width: 16, height: 16, color: 'var(--color-outline)' }} />
                                                        : <ChevronDown style={{ width: 16, height: 16, color: 'var(--color-outline)' }} />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(191,201,193,0.18)' }}>
                                                        <p className="dashboard-section-header" style={{ fontSize: 10, marginBottom: 8 }}>Clinical Report</p>
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
                </>
            )}
        </DashboardLayout>
    )
}
