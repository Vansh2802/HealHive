import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { fetchAvailableTherapists, createSessionBooking } from '../../services/api/sessions'
import { useToast } from '../../components/Toast'
import { SkeletonCard } from '../../components/Skeleton'
import PageTransition from '../../components/PageTransition'
import { Calendar, Clock, CheckCircle, User, Loader2, ArrowLeft } from 'lucide-react'

export default function BookSession() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [therapists, setTherapists] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTherapist, setSelectedTherapist] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [booking, setBooking] = useState(false)
    const [booked, setBooked] = useState(false)
    const [bookingError, setBookingError] = useState('')

    useEffect(() => {
        fetchAvailableTherapists()
            .then(data => {
                setTherapists(data)
            })
            .catch(() => setTherapists([]))
            .finally(() => setLoading(false))
    }, [])

    // Group availability by date for selected therapist
    const groupedAvailability = selectedTherapist
        ? selectedTherapist.availability.reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = []
            acc[slot.date].push(slot)
            return acc
        }, {})
        : {}

    const handleBook = async () => {
        if (!selectedTherapist || !selectedSlot) return
        setBooking(true)
        setBookingError('')

        const result = await createSessionBooking({
            therapistId: selectedTherapist.id,
            slotId: selectedSlot.id,
        })

        if (result?.success) {
            setBooked(true)
            addToast('Session booked successfully!', 'success')
        } else {
            setBookingError(typeof result?.error === 'string' ? result.error : 'Unable to book session. Please try again.')
            addToast(result?.error || 'Booking failed', 'error')
        }
        setBooking(false)
    }

    if (loading) {
        return (
            <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        )
    }

    if (booked) {
        return (
            <PageTransition>
                <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-white flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="text-center max-w-sm"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-wood-800 mb-2">Session Booked!</h2>
                        <p className="text-wood-500 text-sm mb-1">
                            {selectedTherapist.name} — {selectedSlot.date} at {selectedSlot.startTime}
                        </p>
                        <p className="text-xs text-wood-400 mb-6">You'll receive session details in your dashboard.</p>
                        <button onClick={() => navigate('/user/dashboard')}
                            className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-wood-700 to-wood-600 hover:shadow-lg transition-all">
                            Go to Dashboard
                        </button>
                    </motion.div>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button onClick={() => navigate('/user/dashboard')} className="flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </button>

                    <h1 className="text-2xl font-bold text-wood-800 mb-8">Book a Session</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Therapist selection */}
                        <div>
                            <h2 className="text-sm font-semibold text-wood-700 mb-3">Select Therapist</h2>
                            <div className="space-y-3">
                                {therapists.length === 0 ? (
                                    <div className="text-center py-8 bg-white rounded-2xl border border-wood-100">
                                        <User className="w-10 h-10 text-wood-300 mx-auto mb-3" />
                                        <p className="text-sm text-wood-500">No therapists available yet</p>
                                    </div>
                                ) : (
                                    therapists.map(t => (
                                        <motion.button
                                            key={t.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => { setSelectedTherapist(t); setSelectedDate(null); setSelectedSlot(null) }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                                                selectedTherapist?.id === t.id
                                                    ? 'border-wood-400 bg-wood-50/50 shadow-sm'
                                                    : 'border-wood-100 bg-white hover:border-wood-200 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wood-100 to-beige-100 flex items-center justify-center flex-shrink-0">
                                                <User className="w-6 h-6 text-wood-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-wood-800">{t.name}</h3>
                                                <p className="text-xs text-wood-500">{t.specialization}</p>
                                                <p className="text-xs text-wood-400 mt-0.5">{t.availability.length} slots available</p>
                                            </div>
                                            {selectedTherapist?.id === t.id && <CheckCircle className="w-5 h-5 text-wood-500 ml-auto" />}
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Date & Time selection */}
                        <div>
                            {selectedTherapist ? (
                                <>
                                    <h2 className="text-sm font-semibold text-wood-700 mb-3">Select Date & Time</h2>
                                    {Object.keys(groupedAvailability).length > 0 ? (
                                        <div className="space-y-4">
                                            {Object.entries(groupedAvailability).sort().map(([date, slots]) => (
                                                <motion.div
                                                    key={date}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 rounded-2xl border transition-all ${
                                                        selectedDate === date ? 'border-wood-300 bg-wood-50/30' : 'border-wood-100 bg-white'
                                                    }`}
                                                >
                                                    <button onClick={() => { setSelectedDate(date); setSelectedSlot(null) }}
                                                        className="flex items-center gap-2 text-sm font-medium text-wood-700 mb-3">
                                                        <Calendar className="w-4 h-4 text-wood-500" />
                                                        {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </button>
                                                    {selectedDate === date && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {slots.map(slot => (
                                                                <motion.button
                                                                    key={slot.id}
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => setSelectedSlot(slot)}
                                                                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                                                        selectedSlot?.id === slot.id
                                                                            ? 'bg-wood-600 text-white shadow-sm'
                                                                            : 'bg-wood-100 text-wood-600 hover:bg-wood-200'
                                                                    }`}
                                                                >
                                                                    <Clock className="w-3 h-3" />
                                                                    {slot.startTime} - {slot.endTime}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-wood-500 p-4 bg-white rounded-2xl border border-wood-100">No availability set yet.</p>
                                    )}

                                    {selectedSlot && (
                                        <>
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={handleBook}
                                                disabled={booking}
                                                className="mt-6 w-full py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-wood-700 to-wood-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {booking ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Confirm Booking'}
                                            </motion.button>
                                            {bookingError && <p className="mt-2 text-xs text-red-500">{bookingError}</p>}
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-wood-400">
                                    Select a therapist to see availability
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}
