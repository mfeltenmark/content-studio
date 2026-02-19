'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, FlipHorizontal } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera error:', error)
      alert('Kunde inte få åtkomst till kameran')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    stopCamera()
    onCapture(imageData)
  }, [stopCamera, onCapture])

  const toggleCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [facingMode])

  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-8 pt-20">
        <div className="flex items-center justify-between px-8 max-w-lg mx-auto">
          <button onClick={handleCancel} className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
            <X className="h-7 w-7 text-white" />
          </button>
          <button onClick={capturePhoto} className="h-20 w-20 rounded-full bg-white/30 backdrop-blur-sm border-4 border-white relative flex-shrink-0">
            <div className="absolute inset-2 rounded-full bg-white" />
          </button>
          <button onClick={toggleCamera} className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
            <FlipHorizontal className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
