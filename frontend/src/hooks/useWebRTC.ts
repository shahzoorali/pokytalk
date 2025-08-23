import { useEffect, useRef, useState } from 'react'
import Peer from 'simple-peer'
import { WebRTCMessage } from '@pokytalk/shared'

export function useWebRTC() {
  const [peer, setPeer] = useState<Peer.Instance | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [localAudioLevel, setLocalAudioLevel] = useState(0)
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      })

      setLocalStream(stream)

      // Set up audio analysis
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

          const bufferLength = analyserRef.current.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array

      // Start monitoring audio levels
      updateAudioLevel()

      return stream
    } catch (error) {
      console.error('Error accessing microphone:', error)
      throw error
    }
  }

  const updateAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    // @ts-ignore
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    let sum = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i]
    }
    const average = sum / dataArrayRef.current.length
    const normalizedLevel = Math.min(average / 128, 1) // Normalize to 0-1
    
    setLocalAudioLevel(normalizedLevel)
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }

  const createPeer = (initiator: boolean, stream: MediaStream) => {
    const newPeer = new Peer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    })

    newPeer.on('signal', (data) => {
      console.log('Peer signal:', data)
    })

    newPeer.on('connect', () => {
      setIsConnected(true)
      console.log('WebRTC connected')
    })

    newPeer.on('stream', (stream) => {
      setRemoteStream(stream)
      console.log('Remote stream received')
    })

    newPeer.on('close', () => {
      setIsConnected(false)
      setRemoteStream(null)
      console.log('WebRTC connection closed')
    })

    newPeer.on('error', (error) => {
      console.error('WebRTC error:', error)
    })

    setPeer(newPeer)
    return newPeer
  }

  const handleWebRTCMessage = (message: WebRTCMessage) => {
    if (!peer) return

    switch (message.type) {
      case 'offer':
        peer.signal(message.sdp)
        break
      case 'answer':
        peer.signal(message.sdp)
        break
      case 'ice-candidate':
        peer.signal(message.candidate)
        break
    }
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const cleanup = () => {
    if (peer) {
      peer.destroy()
      setPeer(null)
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    setRemoteStream(null)
    setIsConnected(false)
    setIsMuted(false)
    setLocalAudioLevel(0)
    setRemoteAudioLevel(0)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  return {
    peer,
    isConnected,
    localStream,
    remoteStream,
    isMuted,
    localAudioLevel,
    remoteAudioLevel,
    initializeAudio,
    createPeer,
    handleWebRTCMessage,
    toggleMute,
    cleanup,
  }
}
