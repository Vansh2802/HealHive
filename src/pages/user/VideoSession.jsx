import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, ExternalLink, User } from 'lucide-react'
import PageTransition from '../../components/PageTransition'

export default function VideoSession() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const meetingLink = searchParams.get('link') || ''
    const [mic, setMic] = useState(true)
    const [cam, setCam] = useState(true)
    const [ended, setEnded] = useState(false)

    const openMeeting = () => {
        if (meetingLink) {
            window.open(meetingLink, '_blank', 'noopener,noreferrer')
        }
    }

    if (ended) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-wood-950 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Session Ended</h2>
                        <p className="text-wood-400 text-sm mb-6">Thank you for attending your session.</p>
                        <button onClick={() => navigate('/user/dashboard')}
                            className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-wood-600 to-wood-500 hover:shadow-lg transition-all">
                            Back to Dashboard
                        </button>
                    </motion.div>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-wood-950 flex flex-col">
                {/* Video area */}
                <div className="flex-1 relative flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl aspect-video bg-wood-900 rounded-3xl border border-wood-800 flex items-center justify-center relative overflow-hidden">
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-wood-600/20 to-beige-500/20 flex items-center justify-center mx-auto mb-4 border-2 border-wood-600/30">
                                <User className="w-12 h-12 text-wood-400" />
                            </div>
                            <p className="text-white font-medium">Therapy Session</p>
                            <p className="text-wood-500 text-xs mt-1">
                                {meetingLink ? 'Click the button below to join' : 'No meeting link available'}
                            </p>
                            {meetingLink && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={openMeeting}
                                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Join Google Meet
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Self view */}
                    <div className="absolute bottom-8 right-8 w-40 sm:w-48 aspect-video bg-wood-800 rounded-2xl border border-wood-700 flex items-center justify-center shadow-2xl">
                        {cam ? (
                            <div className="text-center">
                                <User className="w-8 h-8 text-wood-500 mx-auto" />
                                <p className="text-wood-500 text-[10px] mt-1">You</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <VideoOff className="w-6 h-6 text-wood-600 mx-auto" />
                                <p className="text-wood-600 text-[10px] mt-1">Camera off</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls bar */}
                <div className="flex items-center justify-center gap-4 py-6 bg-wood-950/90 backdrop-blur-sm border-t border-wood-900">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setMic(!mic)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                            mic ? 'bg-wood-800 text-white hover:bg-wood-700' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}>
                        {mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setCam(!cam)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                            cam ? 'bg-wood-800 text-white hover:bg-wood-700' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}>
                        {cam ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 rounded-2xl bg-wood-800 text-white hover:bg-wood-700 flex items-center justify-center transition-all">
                        <MessageSquare className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEnded(true)}
                        className="w-14 h-14 rounded-2xl bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/25">
                        <PhoneOff className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </PageTransition>
    )
}
