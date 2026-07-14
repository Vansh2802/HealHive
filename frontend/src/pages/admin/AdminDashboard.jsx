import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import DashboardLayout from '../../components/DashboardLayout'
import EmptyState from '../../components/EmptyState'
import SettingsPage from '../../components/SettingsPage'
import Skeleton from '../../components/Skeleton'
import { fetchAdminStats, fetchAdminTherapists, fetchAdminSessions, reviewTherapist } from '../../services/api/admin'
import {
    LayoutDashboard, Users, Stethoscope, CalendarDays, BarChart3, AlertTriangle,
    CheckCircle, XCircle, Clock, TrendingUp, User, Shield, Settings
} from 'lucide-react'

const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { path: '/admin?tab=therapists', label: 'Therapists', icon: Stethoscope },
    { path: '/admin?tab=sessions', label: 'Sessions', icon: CalendarDays },
    { path: '/admin?tab=settings', label: 'Settings', icon: Settings },
]

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

export default function AdminDashboard() {
    const { user } = useAuth()
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || 'overview'
    const setTab = (key) => {
        if (key === 'overview') {
            setSearchParams({})
        } else {
            setSearchParams({ tab: key })
        }
    }

    const [stats, setStats] = useState(null)
    const [therapists, setTherapists] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [s, t, ses] = await Promise.all([
                    fetchAdminStats(),
                    fetchAdminTherapists(),
                    fetchAdminSessions(),
                ])
                if (s.success) setStats(s.stats)
                if (t.success) setTherapists(t.therapists || [])
                if (ses.success) setSessions(ses.sessions || [])
            } catch (err) {
                console.error(err)
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const handleReview = async (therapistId, action) => {
        const result = await reviewTherapist(therapistId, action)
        if (result.success) {
            setTherapists(prev => prev.map(t => {
                const id = t._id || t.id
                if (id === therapistId) {
                    return { ...t, verified: action === 'approve', isApproved: action === 'approve', isRejected: action === 'reject' }
                }
                return t
            }))
            toast.success(`Therapist ${action === 'approve' ? 'approved' : 'rejected'}`)
            setTimeout(() => window.location.reload(), 1000)
        } else {
            toast.error(result.error || 'Action failed')
        }
    }

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'therapists', label: 'Therapists', icon: Stethoscope },
        { key: 'sessions', label: 'Sessions', icon: CalendarDays },
    ]

    const pending = therapists.filter(t => !t.verified && !t.isApproved)
    const approved = therapists.filter(t => t.verified || t.isApproved)

    return (
        <DashboardLayout navItems={navItems} title="Admin Dashboard">
            {tab === 'settings' && <SettingsPage />}

            {(tab === 'overview' || tab === 'therapists' || tab === 'sessions') && (
                <>
                    {/* Greeting */}
                    <motion.div {...fadeUp} className="mb-6">
                        <h2 className="text-2xl font-semibold"
                            style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)' }}>
                            Hello, <span style={{ color: 'var(--color-primary)' }}>{user?.name || 'Admin'}</span>
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-outline)' }}>Here's what's happening on HealHive today.</p>
                    </motion.div>

                    {/* Tabs */}
                    <div className="dashboard-tab-group mb-6">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`dashboard-tab ${tab === t.key ? 'active' : ''}`}>
                                <t.icon style={{ width: 14, height: 14 }} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            {loading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height="h-24" />)}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-sage-600 bg-sage-50' },
                                            { label: 'Therapists', value: stats?.totalTherapists || 0, icon: Stethoscope, color: 'text-lavender-600 bg-lavender-50' },
                                            { label: 'Pending Review', value: stats?.pendingTherapists || 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                                            { label: 'Total Sessions', value: stats?.totalSessions || 0, icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50' },
                                        ].map((s, i) => (
                                            <motion.div key={i} variants={fadeUp}
                                                className="stat-card">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                                                        <s.icon className="w-5 h-5" />
                                                    </div>
                                                    <TrendingUp className="w-4 h-4 text-slate-300" />
                                                </div>
                                                <p className="stat-value">{s.value}</p>
                                                <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>{s.label}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {pending.length > 0 && (
                                        <motion.div variants={fadeUp} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                <h3 className="text-sm font-semibold text-amber-800">{pending.length} Therapist{pending.length > 1 ? 's' : ''} Pending Review</h3>
                                            </div>
                                            <p className="text-xs text-amber-700">Switch to the Therapists tab to review applications.</p>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* Therapists Tab */}
                    {tab === 'therapists' && (
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            {/* Pending */}
                            <h3 className="dashboard-section-header">
                                <Clock className="w-4 h-4 text-amber-500" /> Pending Approval ({pending.length})
                            </h3>
                            {pending.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle}
                                    message="All caught up!"
                                    subtext="No pending therapist applications at this time."
                                />
                            ) : (
                                <div className="space-y-3 mb-8">
                                    {pending.map(t => {
                                        const therapistId = t._id || t.id
                                        return (
                                            <motion.div key={therapistId} variants={fadeUp}
                                                className="session-card flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{t.name || t.userId?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{t.email || t.specialization || 'General'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleReview(therapistId, 'approve')}
                                                        className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => handleReview(therapistId, 'reject')}
                                                        className="px-4 py-2 rounded-xl text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all">
                                                        Reject
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Approved */}
                            <h3 className="dashboard-section-header mt-8">
                                <Shield className="w-4 h-4 text-emerald-500" /> Verified Therapists ({approved.length})
                            </h3>
                            {approved.length === 0 ? (
                                <EmptyState
                                    icon={Stethoscope}
                                    message="No verified therapists yet."
                                    subtext="Approved therapists will show up here."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {approved.map(t => {
                                        const therapistId = t._id || t.id
                                        return (
                                            <motion.div key={therapistId} variants={fadeUp}
                                                className="session-card flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-sage-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{t.name || t.userId?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{t.email || t.specialization || 'General'}</p>
                                                    </div>
                                                </div>
                                                <span className="badge badge-emerald">
                                                    Verified
                                                </span>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Sessions Tab */}
                    {tab === 'sessions' && (
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            <h3 className="dashboard-section-header">
                                <CalendarDays className="w-4 h-4 text-sage-500" /> All Sessions ({sessions.length})
                            </h3>
                            {sessions.length === 0 ? (
                                <EmptyState
                                    icon={CalendarDays}
                                    message="No sessions recorded yet."
                                />
                            ) : (
                                <div className="session-card overflow-hidden p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">User</th>
                                                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Therapist</th>
                                                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                                                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.slice(0, 20).map(s => (
                                                <tr key={s._id || s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3 text-slate-700">{s.userName || 'User'}</td>
                                                    <td className="px-5 py-3 text-slate-700">{s.therapistName || 'Therapist'}</td>
                                                    <td className="px-5 py-3 text-slate-500">{s.date} · {s.time}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`badge ${
                                                            s.status === 'completed' ? 'badge-emerald' :
                                                            s.status === 'upcoming' ? 'badge-sage' :
                                                            s.status === 'ongoing' ? 'badge-amber' :
                                                            'badge-red'
                                                        } capitalize`}>{s.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </>
            )}
        </DashboardLayout>
    )
}
