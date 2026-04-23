const DEFAULT_WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat'
const DEBUG_WS = (import.meta.env.VITE_WS_DEBUG || '1') === '1'

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
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

export class ChatWebSocketAdapter {
    constructor({ wsBaseUrl = DEFAULT_WS_BASE, token = '' } = {}) {
        this.wsBaseUrl = normalizeWsBase(wsBaseUrl)
        this.token = token
        this.sessionId = ''
        this.socket = null
        this.callbacks = new Map()
        this.pendingMessages = []
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 50
        this.baseReconnectDelayMs = 500
        this.maxReconnectDelayMs = 8000
        this.explicitClose = false
        this.reconnectTimer = null
    }

    connect(sessionId) {
        if (!sessionId) {
            throw new Error('session_id is required to connect websocket')
        }

        this.sessionId = sessionId
        this.explicitClose = false
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
        const queryToken = this.token ? `?token=${encodeURIComponent(this.token)}` : ''
        const wsUrl = `${this.wsBaseUrl}/${encodeURIComponent(this.sessionId)}/${queryToken}`
        logWs('opening socket', { wsUrl, reconnect_attempt: this.reconnectAttempts })

        this.socket = new WebSocket(wsUrl)

        this.socket.onopen = () => {
            this.reconnectAttempts = 0
            if (this.reconnectTimer) {
                window.clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }
            logWs('onopen', { session_id: this.sessionId })
            this.emit('connect_session', { session_id: this.sessionId, role: 'user' })
            this._flushQueue()
            this._notify('open', { session_id: this.sessionId })
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
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logWsError('max reconnect attempts reached', { max: this.maxReconnectAttempts })
            this._notify('error', { message: 'Unable to reconnect to chat service' })
            return
        }

        this.reconnectAttempts += 1
        const jitter = Math.floor(Math.random() * 250)
        const delay = Math.min(
            this.maxReconnectDelayMs,
            this.baseReconnectDelayMs * (2 ** (this.reconnectAttempts - 1)) + jitter,
        )
        logWs('scheduling reconnect', { attempt: this.reconnectAttempts, delay_ms: delay })
        this._notify('reconnecting', { attempt: this.reconnectAttempts, delay })
        this.reconnectTimer = window.setTimeout(() => {
            this._openSocket()
        }, delay)
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