import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import ChatBubble from '../../components/ChatBubble'
import DisclaimerBanner from '../../components/DisclaimerBanner'
import { sendMessage } from '../../services/api/chatbot'

const WELCOME_MSG = {
    id: 'welcome',
    text: "Hello, welcome to HealHive. I'm here to listen and support you — this is a safe, anonymous space. How are you feeling today?",
    isBot: true,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

export default function AnonymousChat() {
    const [messages, setMessages] = useState([WELCOME_MSG])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const sessionId = useRef(`session-${Date.now()}`)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || loading) return

        setError(null)
        const userMsg = {
            id: `u-${Date.now()}`,
            text,
            isBot: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        const result = await sendMessage(text, sessionId.current, [...messages, userMsg])

        if (result.success) {
            setMessages(prev => [...prev, {
                id: `b-${Date.now()}`,
                text: result.reply,
                isBot: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }])
        } else {
            setError(result.error)
        }

        setLoading(false)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-beige-100 flex flex-col">
            {/* Chat container */}
            <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
                {/* Disclaimer */}
                <div className="px-4 pt-6 pb-2">
                    <DisclaimerBanner />
                </div>

                {/* Messages area */}
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
                            <button onClick={handleSend} className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700">
                                <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-beige-100 to-transparent">
                    <div className="flex items-end gap-2 bg-white rounded-2xl border border-wood-200 shadow-lg p-1.5 focus-within:border-wood-400 focus-within:ring-2 focus-within:ring-wood-100 transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            rows={1}
                            className="flex-1 resize-none px-3 py-2.5 text-sm text-wood-800 placeholder-wood-400 outline-none bg-transparent max-h-32"
                            style={{ minHeight: '40px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-wood-600 to-wood-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-wood-300/40 transition-all duration-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-wood-400 text-center mt-2">
                        Your conversation is anonymous and not stored permanently.
                    </p>
                </div>
            </div>
        </div>
    )
}
