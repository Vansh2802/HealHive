import { Calendar, Clock, Video, CheckCircle, AlertCircle } from 'lucide-react'

const statusConfig = {
    upcoming: { color: 'text-wood-600 bg-wood-50 border-wood-100', icon: Calendar, label: 'Upcoming' },
    completed: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'text-red-500 bg-red-50 border-red-100', icon: AlertCircle, label: 'Cancelled' },
}

export default function SessionCard({ session, onJoin }) {
    const config = statusConfig[session.status] || statusConfig.upcoming
    const StatusIcon = config.icon

    const sessionDateTime = session.session_time
        ? new Date(session.session_time)
        : new Date(`${session.date}T${session.time}:00`)
    const canJoinNow = Number.isNaN(sessionDateTime.getTime()) ? true : new Date() >= sessionDateTime

    return (
        <div className="bg-white rounded-2xl border border-wood-100 p-5 hover:shadow-md hover:border-wood-200 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-wood-800 text-sm">{session.therapistName}</h4>
                    <p className="text-xs text-wood-500 mt-0.5">Video Session</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-wood-500">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{session.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{session.time}</span>
            </div>

            {session.notes && (
                <p className="text-xs text-wood-500 mt-3 p-2.5 bg-wood-50 rounded-lg line-clamp-2">{session.notes}</p>
            )}

            {session.status === 'upcoming' && onJoin && (
                <>
                <button onClick={() => onJoin(session)} disabled={!canJoinNow}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-wood-600 to-wood-500 transition-all duration-300 ${canJoinNow ? 'hover:shadow-lg hover:shadow-wood-300/40' : 'opacity-50 cursor-not-allowed'}`}>
                    <Video className="w-4 h-4" />
                    Join Video Session
                </button>
                {!canJoinNow && (
                    <p className="mt-2 text-[11px] text-wood-400">Session link activates at scheduled time.</p>
                )}
                </>
            )}
        </div>
    )
}
