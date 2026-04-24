import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw, Send, Wifi, WifiOff } from 'lucide-react'
import ChatBubble from '../../components/ChatBubble'
import DisclaimerBanner from '../../components/DisclaimerBanner'
import { createChatSocketAdapter } from '../../services/chat/websocketAdapter'
import { useAuth } from '../../context/AuthContext'

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

function appendQuestionMessage(prev, payload) {
    const questionText = payload?.question || payload?.next_question || ''
    if (!questionText) return prev

    const lastMessage = prev[prev.length - 1]
    if (lastMessage?.isBot && (lastMessage.text || '').trim() === questionText.trim()) {
        return prev
    }

    return [
        ...prev,
        {
            id: payload?.id || `next-question-${Date.now()}`,
            text: questionText,
            isBot: true,
            options: Array.isArray(payload?.options) ? payload.options : [],
            timestamp: new Date(payload?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]
}

export default function AnonymousChat() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [messages, setMessages] = useState([WELCOME_MSG])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [connectionState, setConnectionState] = useState('connecting')
    const [activeOptions, setActiveOptions] = useState([])
    const [completed, setCompleted] = useState(false)
    const [anonId, setAnonId] = useState('')
    const [textInput, setTextInput] = useState('')

    const messagesEndRef = useRef(null)
    const sessionId = useRef(localStorage.getItem('healhive_anonymous_session_id') || createSessionId())
    const socketRef = useRef(null)
    const sessionInitializedRef = useRef(false)

    useEffect(() => {
        localStorage.setItem('healhive_anonymous_session_id', sessionId.current)
        const adapter = createChatSocketAdapter()

        const unsubOpen = adapter.on('open', () => {
            setConnectionState('connected')
            setLoading(false)
            setError(null)

            if (!sessionInitializedRef.current) {
                adapter.emit('connect_session', {
                    session_id: sessionId.current,
                    role: 'user',
                })
                sessionInitializedRef.current = true
            }
        })

        const unsubReconnecting = adapter.on('reconnecting', () => {
            setConnectionState('reconnecting')
            setLoading(false)
        })

        const unsubClose = adapter.on('close', () => {
            setConnectionState('disconnected')
            setLoading(false)
        })

        const unsubSessionState = adapter.on('session_state', (payload) => {
            setAnonId(payload?.anonymous_user_id || '')
            const normalized = normalizeServerMessages(payload?.messages || [])
            if (normalized.length > 0) {
                setMessages(normalized)
            } else if (payload?.next_question) {
                setMessages((prev) => appendQuestionMessage(prev, payload))
            }
            if (Array.isArray(payload?.options)) {
                setActiveOptions(payload.options)
            }
            setCompleted(Boolean(payload?.completed))
        })

        const unsubNextQuestion = adapter.on('next_question', (payload) => {
            setMessages((prev) => appendQuestionMessage(prev, payload))
            setActiveOptions(Array.isArray(payload?.options) ? payload.options : [])
            setCompleted(Boolean(payload?.completed))
            setLoading(false)
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

        socketRef.current = adapter.connect(sessionId.current)

        return () => {
            unsubOpen()
            unsubReconnecting()
            unsubClose()
            unsubSessionState()
            unsubNextQuestion()
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
        if (!option || loading || completed || connectionState !== 'connected') return
        setError(null)
        setLoading(true)
        setActiveOptions([])

        socketRef.current?.emit('submit_input', {
            session_id: sessionId.current,
            input: {
                type: 'option',
                value: option,
            },
        })
    }

    const handleTextSubmit = () => {
        const value = textInput.trim()
        if (!value || loading || completed || connectionState !== 'connected') return

        setError(null)
        setLoading(true)
        setTextInput('')
        setActiveOptions([])

        socketRef.current?.emit('submit_input', {
            session_id: sessionId.current,
            input: {
                type: 'text',
                value,
            },
        })
    }

    const handleConnectWithTherapist = () => {
        const navigationState = {
            from: '/chat',
            anonymousSessionId: sessionId.current,
            therapistId: null,
        }

        if (isAuthenticated) {
            navigate('/book-session', { state: navigationState })
            return
        }

        navigate('/login', {
            state: {
                ...navigationState,
                redirectTo: '/book-session',
            },
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
                        <p className="text-xs text-wood-500 mb-2">Type how you feel or choose an option below</p>

                        <div className="mb-3 flex items-center gap-2">
                            <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleTextSubmit()
                                    }
                                }}
                                disabled={loading || completed || connectionState === 'disconnected'}
                                placeholder="Share what you are feeling..."
                                className="flex-1 px-3 py-2 rounded-xl border border-wood-200 text-sm text-wood-700 placeholder:text-wood-300 focus:outline-none focus:ring-2 focus:ring-wood-300 disabled:opacity-50"
                            />
                            <button
                                onClick={handleTextSubmit}
                                disabled={!textInput.trim() || loading || completed || connectionState === 'disconnected'}
                                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-wood-600 text-white text-sm hover:bg-wood-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-3.5 h-3.5" /> Send
                            </button>
                        </div>

                        <p className="text-xs text-wood-500 mb-3">Or choose one option to continue</p>
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
                        {activeOptions.length === 0 && !loading && !completed && connectionState !== 'connected' && (
                            <p className="text-xs text-wood-400">
                                {connectionState === 'reconnecting' ? 'Reconnecting to chat...' : 'Connecting to chat...'}
                            </p>
                        )}

                        {completed && (
                            <div className="mt-3 pt-3 border-t border-wood-100">
                                <button
                                    onClick={handleConnectWithTherapist}
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
