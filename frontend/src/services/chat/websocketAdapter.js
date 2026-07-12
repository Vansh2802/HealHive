/**
 * websocketAdapter.js
 * -------------------
 * Task 7: Exponential-backoff reconnect (1s → 2s → 4s → 8s, max 5 tries).
 * On successful reconnect, fetches the last N messages from MongoDB chat
 * history via the REST endpoint and emits a 'history' event so the UI can
 * replay context.
 */

const WS_BASE = 'ws://127.0.0.1:8000'
const WS_CHAT_PATH = '/ws/chat'
const DEFAULT_WS_BASE = WS_BASE
const DEBUG_WS = (import.meta.env.VITE_WS_DEBUG || '1') === '1'

// Number of messages to replay from history after a successful reconnect
const HISTORY_REPLAY_COUNT = 10

function logWs(...args) {
    if (!DEBUG_WS) return
    console.info('[HealHive:WS]', ...args)
}

function logWsError(...args) {
    if (!DEBUG_WS) return
    console.error('[HealHive:WS]', ...args)
}

function normalizeWsBase(baseUrl) {
    if (!baseUrl) return DEFAULT_WS_BASE
    try {
        const parsed = new URL(baseUrl)
        return `${parsed.protocol}//${parsed.host}`
    } catch {
        return DEFAULT_WS_BASE
    }
}

/**
 * Build the REST API base URL from the WS base URL, or from the env var.
 * e.g. ws://127.0.0.1:8000 → http://127.0.0.1:8000/api
 */
function buildApiBase(wsBase) {
    try {
        const parsed = new URL(wsBase.replace(/^ws/, 'http'))
        return `${parsed.protocol}//${parsed.host}/api`
    } catch {
        return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    }
}

export class ChatWebSocketAdapter {
    constructor({ wsBaseUrl = DEFAULT_WS_BASE, token = '' } = {}) {
        this.wsBaseUrl = normalizeWsBase(wsBaseUrl)
        this.apiBase = buildApiBase(this.wsBaseUrl)
        this.token = token
        this.sessionId = ''
        this.socket = null
        this.callbacks = new Map()
        this.pendingMessages = []

        // Task 7: max 5 retries at 1s, 2s, 4s, 8s (capped)
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.baseReconnectDelayMs = 1000
        this.maxReconnectDelayMs = 8000

        this.explicitClose = false
        this.reconnectTimer = null
    }

    connect(sessionId) {
        if (!sessionId) {
            throw new Error('session_id is required to connect websocket')
        }

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            logWs('connect() skipped: socket already active', {
                session_id: this.sessionId,
                readyState: this.socket.readyState,
            })
            return this
        }

        this.sessionId = sessionId
        this.explicitClose = false
        console.log('Connecting to:', WS_BASE)
        logWs('connect()', { session_id: sessionId, ws_base: this.wsBaseUrl })
        this._openSocket()
        return this
    }

    disconnect() {
        this.explicitClose = true
        if (this.reconnectTimer) {
            window.clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        logWs('disconnect()', { session_id: this.sessionId })
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
    }

    emit(event, data = {}) {
        const payload = {
            event,
            data,
        }

        const serialized = JSON.stringify(payload)
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            logWs('emit -> send', payload)
            this.socket.send(serialized)
            return
        }

        logWs('emit -> queued', payload)
        this.pendingMessages.push(serialized)
    }

    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set())
        }
        this.callbacks.get(event).add(callback)

        return () => {
            const subscribers = this.callbacks.get(event)
            if (!subscribers) return
            subscribers.delete(callback)
            if (subscribers.size === 0) {
                this.callbacks.delete(event)
            }
        }
    }

    _openSocket() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            logWs('openSocket skipped: socket already active', {
                readyState: this.socket.readyState,
            })
            return
        }

        const queryToken = this.token ? `?token=${encodeURIComponent(this.token)}` : ''
        const wsUrl = `${this.wsBaseUrl}${WS_CHAT_PATH}/${encodeURIComponent(this.sessionId)}/${queryToken}`
        logWs('opening socket', { wsUrl, reconnect_attempt: this.reconnectAttempts })

        this.socket = new WebSocket(wsUrl)

        this.socket.onopen = () => {
            const wasReconnect = this.reconnectAttempts > 0
            this.reconnectAttempts = 0
            if (this.reconnectTimer) {
                window.clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }
            logWs('onopen', { session_id: this.sessionId, wasReconnect })
            this._flushQueue()
            this._notify('open', { session_id: this.sessionId })

            // Task 7: On reconnect, replay recent history
            if (wasReconnect) {
                this._notify('reconnected', { session_id: this.sessionId })
                this._fetchAndReplayHistory(this.sessionId, HISTORY_REPLAY_COUNT)
            }
        }

        this.socket.onmessage = (message) => {
            try {
                const parsed = JSON.parse(message.data)
                if (!parsed || typeof parsed !== 'object') return

                logWs('onmessage', parsed)

                const eventName = parsed.event
                const eventData = parsed.data || {}
                if (eventName) {
                    this._notify(eventName, eventData)
                }
                this._notify('message', parsed)
            } catch {
                logWsError('invalid JSON from server', message.data)
                this._notify('error', { message: 'Invalid server payload' })
            }
        }

        this.socket.onerror = (event) => {
            logWs('onerror', event)
        }

        this.socket.onclose = (event) => {
            logWs('onclose', { code: event.code, reason: event.reason, wasClean: event.wasClean })
            this._notify('close', { session_id: this.sessionId, code: event.code, reason: event.reason })
            if (!this.explicitClose) {
                this._scheduleReconnect()
            }
        }
    }

    _scheduleReconnect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            logWs('reconnect skipped: socket already active', {
                readyState: this.socket.readyState,
            })
            return
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            // Task 7: Only show hard error after ALL retries are exhausted
            logWsError('max reconnect attempts reached', { max: this.maxReconnectAttempts })
            this._notify('error', { message: 'Unable to reconnect to chat service' })
            return
        }

        this.reconnectAttempts += 1
        const jitter = Math.floor(Math.random() * 200)
        // Task 7: exponential backoff 1s → 2s → 4s → 8s (capped)
        const delay = Math.min(
            this.maxReconnectDelayMs,
            this.baseReconnectDelayMs * (2 ** (this.reconnectAttempts - 1)) + jitter,
        )
        logWs('scheduling reconnect', { attempt: this.reconnectAttempts, delay_ms: delay })
        // Task 7: Emit 'reconnecting' so UI shows "Reconnecting..." instead of "Disconnected"
        this._notify('reconnecting', { attempt: this.reconnectAttempts, delay, maxAttempts: this.maxReconnectAttempts })
        this.reconnectTimer = window.setTimeout(() => {
            this._openSocket()
        }, delay)
    }

    /**
     * Task 7: Fetch the last N messages from MongoDB chat history via REST
     * and emit a 'history' event so the chat UI can replay them.
     */
    async _fetchAndReplayHistory(sessionId, limit = 10) {
        try {
            const params = new URLSearchParams({ session_id: sessionId, limit: String(limit) })
            const headers = {}
            if (this.token) headers['Authorization'] = `Bearer ${this.token}`

            const res = await fetch(`${this.apiBase}/realtime-chat/history?${params}`, { headers })
            if (!res.ok) {
                logWsError('history fetch failed', res.status)
                return
            }
            const data = await res.json()
            const messages = Array.isArray(data.messages) ? data.messages : []
            if (messages.length > 0) {
                logWs('replaying history messages', { count: messages.length })
                this._notify('history', { session_id: sessionId, messages })
            }
        } catch (err) {
            logWsError('history fetch error', err)
        }
    }

    _flushQueue() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return
        }

        while (this.pendingMessages.length > 0) {
            const payload = this.pendingMessages.shift()
            logWs('flush queued payload', payload)
            this.socket.send(payload)
        }
    }

    _notify(event, payload) {
        const listeners = this.callbacks.get(event)
        if (!listeners || listeners.size === 0) {
            return
        }
        listeners.forEach((listener) => listener(payload))
    }
}

export function createChatSocketAdapter(options = {}) {
    return new ChatWebSocketAdapter(options)
}