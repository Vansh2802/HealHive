import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import ChatBubble from '../../components/ChatBubble'
import DisclaimerBanner from '../../components/DisclaimerBanner'
import { createChatSocketAdapter } from '../../services/chat/websocketAdapter'

const WELCOME_MSG = {
    id: 'welcome',
    text: "Hi, I am here with you. Let's take this one step at a time.",
    isBot: true,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

function createSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `session-${crypto.randomUUID()}`
    }
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeServerMessages(serverMessages = []) {
    return serverMessages.map((msg, index) => ({
        id: msg.id || `${msg.role || 'msg'}-${index}-${Date.now()}`,
        text: msg.text || msg.content || '',
        isBot: (msg.role || msg.sender_type) !== 'user',
        options: Array.isArray(msg.options) ? msg.options : [],
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
}

export default function AnonymousChat() {
    const navigate = useNavigate()
    const [messages, setMessages] = useState([WELCOME_MSG])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [connectionState, setConnectionState] = useState('connecting')
    const [activeOptions, setActiveOptions] = useState([])
    const [completed, setCompleted] = useState(false)
    const [anonId, setAnonId] = useState('')

    const messagesEndRef = useRef(null)
    const sessionId = useRef(localStorage.getItem('healhive_anonymous_session_id') || createSessionId())
    const socketRef = useRef(null)

    useEffect(() => {
        localStorage.setItem('healhive_anonymous_session_id', sessionId.current)
        const adapter = createChatSocketAdapter()
        socketRef.current = adapter.connect(sessionId.current)

        const unsubOpen = adapter.on('open', () => {
            setConnectionState('connected')
            setError(null)
        })

        const unsubReconnecting = adapter.on('reconnecting', () => {
            setConnectionState('reconnecting')
        })

        const unsubClose = adapter.on('close', () => {
            setConnectionState('disconnected')
        })

        const unsubSessionState = adapter.on('session_state', (payload) => {
            setAnonId(payload?.anonymous_user_id || '')
            const normalized = normalizeServerMessages(payload?.messages || [])
            if (normalized.length > 0) {
                setMessages(normalized)
            }
            if (Array.isArray(payload?.options)) {
                setActiveOptions(payload.options)
            }
            setCompleted(Boolean(payload?.completed))
        })

        const unsubReceive = adapter.on('receive_message', (payload) => {
            const incoming = {
                id: payload.id || `${payload.sender_type}-${Date.now()}`,
                text: payload.content || '',
                isBot: payload.sender_type !== 'user',
                options: Array.isArray(payload.options) ? payload.options : [],
                timestamp: new Date(payload.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            setMessages((prev) => [...prev, incoming])
            if (payload.sender_type !== 'user') {
                setLoading(false)
                setActiveOptions(incoming.options || [])
                setCompleted(Boolean(payload.completed))
            }
        })

        const unsubError = adapter.on('error', (payload) => {
            setLoading(false)
            setError(payload?.message || 'Unable to connect to chatbot service.')
        })

        const unsubEscalation = adapter.on('escalate_to_therapist', (payload) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `escalation-${Date.now()}`,
                    text: payload.reason || 'A therapist has been requested to review your check-in.',
                    isBot: true,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ])
        })

        return () => {
            unsubOpen()
            unsubReconnecting()
            unsubClose()
            unsubSessionState()
            unsubReceive()
            unsubError()
            unsubEscalation()
            adapter.disconnect()
            socketRef.current = null
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, activeOptions, completed])

    const handleOptionClick = (option) => {
        if (!option || loading || completed) return
        setError(null)
        setLoading(true)
        setActiveOptions([])

        socketRef.current?.emit('select_option', {
            session_id: sessionId.current,
            option,
        })
    }

    const renderConnectionBadge = () => {
        if (connectionState === 'connected') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <Wifi className="w-3 h-3" /> Connected
                </span>
            )
        }
        if (connectionState === 'reconnecting') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Reconnecting
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" /> Disconnected
            </span>
        )
    }

    return (
        <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-beige-100 flex flex-col">
            <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
                <div className="px-4 pt-6 pb-2 flex items-center justify-between gap-3">
                    <DisclaimerBanner />
                    {renderConnectionBadge()}
                </div>

                <div className="px-4 pb-1 text-xs text-wood-500">
                    Anonymous ID: <span className="font-semibold">{anonId || 'Generating...'}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {messages.map(msg => (
                        <ChatBubble
                            key={msg.id}
                            message={msg.text}
                            isBot={msg.isBot}
                            timestamp={msg.timestamp}
                        />
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wood-100 to-beige-100 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-wood-600 animate-spin" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/80 border border-wood-100 shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-wood-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-wood-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-wood-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            <span>{error}</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-beige-100 to-transparent">
                    <div className="bg-white rounded-2xl border border-wood-200 shadow-lg p-3">
                        <p className="text-xs text-wood-500 mb-3">Choose one option to continue</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {activeOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={loading || completed || connectionState === 'disconnected'}
                                    className="text-left px-3 py-2 rounded-xl border border-wood-200 text-sm text-wood-700 hover:bg-wood-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        {activeOptions.length === 0 && !loading && (
                            <p className="text-xs text-wood-400">Waiting for next prompt...</p>
                        )}

                        {completed && (
                            <div className="mt-3 pt-3 border-t border-wood-100">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-wood-600 to-wood-500 text-white text-sm font-medium hover:shadow-lg transition-all"
                                >
                                    Connect with a Therapist
                                </button>
                                <p className="text-[11px] text-wood-400 mt-2 text-center">
                                    Optional support whenever you feel ready.
                                </p>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-wood-400 text-center mt-2">
                        Your chat uses an anonymous session ID and therapist reports hide personal identity.
                    </p>
                </div>
            </div>
        </div>
    )
}
