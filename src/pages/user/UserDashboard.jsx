import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { fetchMySessions } from '../../services/api/sessions'
import DashboardLayout from '../../components/DashboardLayout'
import Skeleton from '../../components/Skeleton'
import { LayoutDashboard, CalendarPlus, MessageCircle, Video, Calendar, Clock, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'

const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/user/book', label: 'Book Session', icon: CalendarPlus },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
]

const statusConfig = {
    upcoming: { color: 'bg-sage-50 text-sage-700 border-sage-200', icon: Calendar },
    completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    cancelled: { color: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle },
}

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function UserDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.id) return
        fetchMySessions('user')
            .then(data => setSessions(data))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false))
    }, [user?.id])

    const upcoming = sessions.filter(s => s.status === 'upcoming')
    const completed = sessions.filter(s => s.status === 'completed')

    return (
        <DashboardLayout navItems={navItems} title="Dashboard">
            {/* Welcome */}
            <motion.div {...fadeUp} className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                    Welcome back, <span className="text-sage-600">{user?.name?.split(' ')[0] || 'there'}</span> 👋
                </h2>
                <p className="text-slate-500 mt-1">Here's a snapshot of your wellness journey.</p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <Link to="/user/book" className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-sage-200 hover:shadow-lg hover:shadow-sage-100/40 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-500 to-sage-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CalendarPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">Book a Session</h3>
                        <p className="text-xs text-slate-500">Find a therapist and schedule</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-sage-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link to="/chat" className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-lavender-200 hover:shadow-lg hover:shadow-lavender-100/40 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-500 to-lavender-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">AI Chat</h3>
                        <p className="text-xs text-slate-500">Anonymous support anytime</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-lavender-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-sage-50 to-lavender-50 rounded-2xl border border-sage-100/50">
                    <Sparkles className="w-6 h-6 text-sage-500" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Daily reminder</p>
                        <p className="text-xs text-slate-500">You're doing great. One step at a time. 💚</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-sage-600">{upcoming.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Upcoming</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{completed.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                    <p className="text-2xl font-bold text-lavender-600">{sessions.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Total</p>
                </div>
            </motion.div>

            {/* Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming */}
                <motion.div variants={stagger} initial="initial" animate="animate">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sage-500" /> Upcoming Sessions
                    </h3>
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton height="h-24" />
                            <Skeleton height="h-24" />
                        </div>
                    ) : upcoming.length > 0 ? (
                        <div className="space-y-3">
                            {upcoming.map(s => (
                                <motion.div key={s.id} variants={fadeUp}
                                    className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-sage-200 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">{s.therapistName || 'Therapist'}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Video Session</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-700 border border-sage-200">
                                            Upcoming
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{s.date}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.time}</span>
                                    </div>
                                    {s.meeting_link && (
                                        <button onClick={() => navigate(`/user/session?link=${encodeURIComponent(s.meeting_link)}`)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-lg hover:shadow-sage-300/30 transition-all">
                                            <Video className="w-4 h-4" /> Join Session
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-600 mb-1">No upcoming sessions</p>
                            <p className="text-xs text-slate-400 mb-4">Ready to take the next step?</p>
                            <Link to="/user/book" className="text-sm font-medium text-sage-600 hover:text-sage-700 transition-colors">
                                Book a session →
                            </Link>
                        </div>
                    )}
                </motion.div>

                {/* Completed */}
                <motion.div variants={stagger} initial="initial" animate="animate">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Past Sessions
                    </h3>
                    {completed.length > 0 ? (
                        <div className="space-y-3">
                            {completed.map(s => (
                                <motion.div key={s.id} variants={fadeUp}
                                    className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">{s.therapistName || 'Therapist'}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span>{s.date}</span>
                                                <span>{s.time}</span>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Completed
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                            <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-600 mb-1">No past sessions</p>
                            <p className="text-xs text-slate-400">Completed sessions will appear here.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
