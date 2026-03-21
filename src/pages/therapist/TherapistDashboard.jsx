import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import DashboardLayout from '../../components/DashboardLayout'
import Skeleton from '../../components/Skeleton'
import { fetchAvailability, createAvailability, deleteAvailability } from '../../services/api/availability'
import { getToken } from '../../services/api/auth'
import { fetchMySessions } from '../../services/api/sessions'
import {
    LayoutDashboard, Calendar, Clock, CheckCircle, Plus, X, Loader2,
    FileText, ChevronDown, ChevronUp, AlertTriangle, Video, Sparkles, Trash2
} from 'lucide-react'

const navItems = [
    { path: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
]

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

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
    const [slotStart, setSlotStart] = useState('')
    const [slotEnd, setSlotEnd] = useState('')
    const [slotError, setSlotError] = useState('')

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
        const token = getToken()
        if (!token) return
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (d.success) setReports(d.reports) })
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

    const handleDeleteSlot = async (id) => {
        await deleteAvailability(id)
        setAvailability(a => a.filter(s => s.id !== id))
        toast.success('Slot deleted')
    }

    const handleJoinSession = (session) => {
        if (!session?.meeting_link) return
        window.open(session.meeting_link, '_blank', 'noopener,noreferrer')
    }

    const upcoming = sessions.filter(s => s.status === 'upcoming')
    const completed = sessions.filter(s => s.status === 'completed')

    const tabs = [
        { key: 'sessions', label: 'Sessions', icon: Calendar },
        { key: 'availability', label: 'Availability', icon: Clock },
        { key: 'reports', label: 'Reports', icon: FileText },
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
                    </button>
                ))}
            </div>

            {/* Sessions Tab */}
            {tab === 'sessions' && (
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
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-700">Upcoming</span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-500 mb-3">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                                        </div>
                                        {s.meeting_link && (
                                            <button onClick={() => handleJoinSession(s)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-lg transition-all">
                                                <Video className="w-4 h-4" /> Join Session
                                            </button>
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
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Done</span>
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
            )}

            {/* Availability Tab */}
            {tab === 'availability' && (
                <motion.div variants={stagger} initial="initial" animate="animate">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sage-500" /> Your Slots
                        </h3>
                        <button onClick={() => setShowAddSlot(!showAddSlot)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-lg transition-all">
                            <Plus className="w-4 h-4" /> Add Slot
                        </button>
                    </div>

                    {showAddSlot && (
                        <motion.div {...fadeUp} className="bg-white rounded-2xl border border-sage-200 p-5 mb-6">
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
                            {slotError && <p className="text-xs text-red-600 mb-3">{slotError}</p>}
                            <div className="flex gap-2">
                                <button onClick={handleAddSlot}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sage-600 hover:bg-sage-700 transition-all">Save</button>
                                <button onClick={() => { setShowAddSlot(false); setSlotError('') }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    )}

                    {availabilityLoading ? <Skeleton height="h-16" count={3} /> : availability.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availability.map(slot => (
                                <motion.div key={slot.id} variants={fadeUp}
                                    className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-sage-500" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">
                                                {new Date(slot.start_time).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${slot.is_booked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
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
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-lavender-500" /> Assessment Reports
                    </h3>
                    {reportsLoading ? <Skeleton height="h-16" count={3} /> : reports.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 mb-1">No reports yet</p>
                            <p className="text-xs text-slate-400">Reports appear after chatbot assessments.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map(r => {
                                const isExpanded = expandedReport === r.id
                                const severity = r.severity
                                const sevColors = {
                                    Minimal: 'bg-emerald-50 text-emerald-700',
                                    Mild: 'bg-amber-50 text-amber-700',
                                    Moderate: 'bg-orange-50 text-orange-700',
                                    Severe: 'bg-red-50 text-red-700',
                                }
                                return (
                                    <motion.div key={r.id} variants={fadeUp}
                                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                                        <button onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {(r.tool_used || r.toolUsed) && (
                                                        <span className="text-xs font-semibold text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded">
                                                            {r.tool_used || r.toolUsed}
                                                        </span>
                                                    )}
                                                    {severity && (
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${sevColors[severity] || 'bg-slate-50 text-slate-700'}`}>
                                                            {severity}
                                                        </span>
                                                    )}
                                                    {r.score != null && <span className="text-xs text-slate-500">Score: {r.score}</span>}
                                                    {severity === 'Severe' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
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
                                                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-xl p-4 leading-relaxed">
                                                    {r.therapist_report || r.therapistReport}
                                                </pre>
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
