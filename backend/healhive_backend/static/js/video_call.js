const root = document.getElementById('video-root')
const roomId = root.dataset.roomId
const token = root.dataset.token

const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')
const toggleMicBtn = document.getElementById('toggleMicBtn')
const toggleCamBtn = document.getElementById('toggleCamBtn')
const endSessionBtn = document.getElementById('endSessionBtn')
const timerEl = document.getElementById('sessionTimer')
const connectionStatusEl = document.getElementById('connectionStatus')
const waitingMessageEl = document.getElementById('waitingMessage')

let localStream
let peerConnection
let socket
let sessionSeconds = 0
let timerInterval

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
}

async function startLocalMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideo.srcObject = localStream
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig)

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = event => {
        const [stream] = event.streams
        remoteVideo.srcObject = stream
    }

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.send(
                JSON.stringify({
                    type: 'ice_candidate',
                    payload: event.candidate,
                })
            )
        }
    }
}

async function makeOffer() {
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.send(
        JSON.stringify({
            type: 'offer',
            payload: offer,
        })
    )
}

function startTimer() {
    timerInterval = setInterval(() => {
        sessionSeconds += 1
        const minutes = String(Math.floor(sessionSeconds / 60)).padStart(2, '0')
        const seconds = String(sessionSeconds % 60).padStart(2, '0')
        timerEl.textContent = `${minutes}:${seconds}`
    }, 1000)
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    socket = new WebSocket(`${protocol}://${window.location.host}/ws/video-call/${roomId}/?token=${encodeURIComponent(token)}`)

    socket.onopen = () => {
        startTimer()
        socket.send(JSON.stringify({ type: 'join_room' }))
    }

    socket.onmessage = async event => {
        const data = JSON.parse(event.data)

        if (data.type === 'peer_joined') {
            await makeOffer()
            return
        }

        if (data.type === 'connection_status') {
            const status = data.status || 'waiting'
            connectionStatusEl.textContent = status === 'connected' ? 'Connected' : 'Waiting'
            waitingMessageEl.style.display = status === 'connected' ? 'none' : 'block'
            return
        }

        if (data.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload))
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            socket.send(JSON.stringify({ type: 'answer', payload: answer }))
            return
        }

        if (data.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload))
            return
        }

        if (data.type === 'ice_candidate' && data.payload) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.payload))
            return
        }

        if (data.type === 'peer_left') {
            remoteVideo.srcObject = null
        }
    }
}

toggleMicBtn.addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0]
    audioTrack.enabled = !audioTrack.enabled
    toggleMicBtn.textContent = audioTrack.enabled ? 'Mute' : 'Unmute'
})

toggleCamBtn.addEventListener('click', () => {
    const videoTrack = localStream.getVideoTracks()[0]
    videoTrack.enabled = !videoTrack.enabled
    toggleCamBtn.textContent = videoTrack.enabled ? 'Camera Off' : 'Camera On'
})

endSessionBtn.addEventListener('click', () => {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave_room' }))
        socket.close()
    }

    clearInterval(timerInterval)
    peerConnection?.close()
    localStream?.getTracks().forEach(track => track.stop())
    window.location.href = '/'
})

async function init() {
    await startLocalMedia()
    createPeerConnection()
    connectWebSocket()
}

init().catch(() => {
    alert('Unable to start video session. Please check camera/microphone permissions.')
})
