'use client'

import { useState, useRef } from 'react'
import { Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface AudioRecorderProps {
  onRecordingComplete: (transcript: string) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        
        setIsTranscribing(true)
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })
          
          const data = await response.json()
          
          if (data.text) {
            onRecordingComplete(data.text)
          } else {
            throw new Error('No text')
          }
        } catch (error) {
          console.error('Error:', error)
          const userText = prompt('Transkribering misslyckades. Skriv din text:')
          if (userText) onRecordingComplete(userText)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      alert('Kunde inte starta inspelning')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Spela in ljud
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-20" />
            )}
            <div className="text-white text-center">
              <div className="text-3xl font-bold">{formatTime(recordingTime)}</div>
              {isRecording && <div className="text-xs mt-1">Spelar in...</div>}
              {isTranscribing && <div className="text-xs mt-1">Transkriberar...</div>}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!isRecording && !isTranscribing ? (
            <Button onClick={startRecording} size="lg" className="h-14 px-8 bg-red-500 hover:bg-red-600">
              <Mic className="h-5 w-5 mr-2" />
              Börja spela in
            </Button>
          ) : isRecording ? (
            <Button onClick={stopRecording} size="lg" className="h-14 px-8">
              <Square className="h-5 w-5 mr-2" />
              Stoppa
            </Button>
          ) : (
            <div className="text-center text-sm">Transkriberar...</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
