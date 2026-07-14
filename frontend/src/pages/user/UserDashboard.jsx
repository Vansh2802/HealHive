import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { fetchMySessions } from '../../services/api/sessions'
import DashboardLayout from '../../components/DashboardLayout'
import EmptyState from '../../components/EmptyState'
import SettingsPage from '../../components/SettingsPage'
import Skeleton from '../../components/Skeleton'
import {
    LayoutDashboard, CalendarPlus, MessageCircle, Video,
    Calendar, Clock, CheckCircle, AlertCircle, ArrowRight, Sparkles, FileText, Settings
} from 'lucide-react'

const navItems = [
    { path: '/user/dashboard', label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { path: '/user/book',      label: 'Book Session', icon: CalendarPlus },
    { path: '/chat',           label: 'Chat',         icon: MessageCircle },
    { path: '/user/dashboard?tab=reports',   label: 'My Reports',   icon: FileText },
    { path: '/user/dashboard?tab=settings',  label: 'Settings',     icon: Settings },
]

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } }

export default function UserDashboard() {
    const { user }     = useAuth()
    const navigate     = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || 'dashboard'
    const setTab = (key) => {
        if (key === 'dashboard') {
            setSearchParams({})
        } else {
            setSearchParams({ tab: key })
        }
    }

    const [sessions,  setSessions]  = useState([])
    const [loading,   setLoading]   = useState(true)

    useEffect(() => {
        if (!user?.id) return
        fetchMySessions('user')
            .then(data => setSessions(data))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false))
    }, [user?.id])

    const upcoming   = sessions.filter(s => s.status === 'upcoming' || s.status === 'ongoing')
    const completed  = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled')

    return (
        <DashboardLayout navItems={navItems} title="Dashboard">

            {tab === 'settings' && <SettingsPage />}

            {tab === 'reports' && (
                <motion.div {...fadeUp}>
                    <h2 className="text-2xl font-semibold mb-6"
                        style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)' }}>
                        My Reports
                    </h2>
                    <EmptyState
                        icon={FileText}
                        message="No reports generated yet"
                        subtext="Complete assessment chats to generate personalized clinical reports."
                        ctaLabel="Start Assessment Chat"
                        ctaTo="/chat"
                    />
                </motion.div>
            )}

            {(tab === 'dashboard') && (
                <>
                    {/* ── Welcome ── */}
                    <motion.div {...fadeUp} className="mb-8">
                        <h2 className="text-2xl font-semibold"
                            style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)' }}>
                            Welcome back,{' '}
                            <span style={{ color: 'var(--color-primary)' }}>
                                {user?.name?.split(' ')[0] || 'there'}
                            </span>{' '}
                            👋
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-outline)' }}>
                            Here's a snapshot of your wellness journey.
                        </p>
                    </motion.div>

                    {/* ── Quick Actions ── */}
                    <motion.div
                        {...fadeUp}
                        transition={{ delay: 0.05 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
                    >
                        <Link to="/user/book" className="action-card">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                                 style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}>
                                <CalendarPlus className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>Book a Session</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>Find a therapist and schedule</p>
                            </div>
                            <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                                        style={{ color: 'var(--color-outline)' }} />
                        </Link>

                        <Link to="/chat" className="action-card">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}>
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>AI Chat</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>Anonymous support anytime</p>
                            </div>
                            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-outline)' }} />
                        </Link>

                        <div className="action-card cursor-default"
                             style={{ background: 'linear-gradient(135deg, var(--color-surface-container-low), var(--color-surface-container))', border: '1px solid rgba(191,201,193,0.20)' }}>
                            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>Daily reminder</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>You're doing great. One step at a time. 💚</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Stats ── */}
                    <motion.div
                        {...fadeUp}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-3 gap-4 mb-8"
                    >
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: 'var(--color-primary)' }}>{upcoming.length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Upcoming</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: '#059669' }}>{completed.filter(s => s.status === 'completed').length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Completed</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-value" style={{ color: '#7c3aed' }}>{sessions.length}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>Total</p>
                        </div>
                    </motion.div>

                    {/* ── Sessions ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Upcoming */}
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2"
                                style={{ color: 'var(--color-outline)' }}>
                                <Calendar className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                Upcoming Sessions
                            </h3>

                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton height="h-24" />
                                    <Skeleton height="h-24" />
                                </div>
                            ) : upcoming.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming.map(s => (
                                        <motion.div key={s.id} variants={fadeUp} className="session-card">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                        {s.therapistName || 'Therapist'}
                                                    </h4>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>Video Session</p>
                                                </div>
                                                <span className={`badge ${s.status === 'ongoing' ? 'badge-amber' : 'badge-sage'} capitalize`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--color-outline)' }}>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />{s.date}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />{s.time}
                                                </span>
                                            </div>
                                            {s.meeting_link && s.status === 'ongoing' && (
                                                <button
                                                    onClick={() => navigate(`/user/session?link=${encodeURIComponent(s.meeting_link)}`)}
                                                    className="btn-join"
                                                >
                                                    <Video className="w-4 h-4" /> Join Session
                                                </button>
                                            )}
                                            {s.meeting_link && s.status === 'upcoming' && (
                                                <div className="w-full py-2.5 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-2"
                                                     style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-outline)' }}>
                                                    <Clock className="w-4 h-4" /> Available at {s.time}
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
                                    subtext="Ready to take the next step on your wellness journey?"
                                    ctaLabel="Book a session"
                                    ctaTo="/user/book"
                                />
                            )}
                        </motion.div>

                        {/* Past Sessions */}
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2"
                                style={{ color: 'var(--color-outline)' }}>
                                <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                                Past Sessions
                            </h3>

                            {completed.length > 0 ? (
                                <div className="space-y-3">
                                    {completed.map(s => (
                                        <motion.div key={s.id} variants={fadeUp} className="session-card">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                        {s.therapistName || 'Therapist'}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--color-outline)' }}>
                                                        <span>{s.date}</span>
                                                        <span>{s.time}</span>
                                                    </div>
                                                </div>
                                                <span className={`badge ${s.status === 'cancelled' ? 'badge-red' : 'badge-emerald'} capitalize`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={CheckCircle}
                                    message="No past sessions"
                                    subtext="Your completed sessions will appear here."
                                />
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
