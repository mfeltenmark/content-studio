'use client'

import { useState, useEffect } from 'react'
import { Camera, Linkedin, CheckCircle, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CameraCapture } from '@/components/camera-capture'
import { AudioRecorder } from '@/components/audio-recorder'

type Step = 'start' | 'capture' | 'record' | 'edit'
type Platform = 'linkedin' | 'instagram' | 'both'
type Tone = 'standard' | 'professionell' | 'inspirerande' | 'engagerande' | 'tankeväckande' | 'konkret'

interface Draft {
  id: string
  title: string
  originalImage: string | null
  generatedText: string
  platform: string
  createdAt: string
}

export default function Home() {
  const [step, setStep] = useState<Step>('start')
  const [platform, setPlatform] = useState<Platform>('linkedin')
  const [tone, setTone] = useState<Tone>('standard')
  const [imageData, setImageData] = useState<string>()
  const [audioTranscript, setAudioTranscript] = useState<string>()
  const [polishedText, setPolishedText] = useState<string>()
  const [imageAnalysis, setImageAnalysis] = useState<any>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [currentDraftId, setCurrentDraftId] = useState<string>()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('linkedin') === 'connected') {
      setLinkedInConnected(true)
      window.history.replaceState({}, '', '/')
    }
    
    fetch('/api/linkedin/status')
      .then(res => res.json())
      .then(data => setLinkedInConnected(data.connected))
      .catch(() => setLinkedInConnected(false))

    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      const res = await fetch('/api/drafts')
      const data = await res.json()
      setDrafts(data)
    } catch (error) {
      console.error('Failed to load drafts:', error)
    }
  }

  const handleImageCapture = (data: string) => {
    setImageData(data)
    setStep('record')
  }

  const handleAudioComplete = async (transcript: string) => {
    setAudioTranscript(transcript)
    setStep('edit')
    setIsProcessing(true)

    try {
      if (imageData) {
        const imgRes = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        })
        const imgData = await imgRes.json()
        setImageAnalysis(imgData)
      }

      const textRes = await fetch('/api/polish-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, platform, tone }),
      })
      const textData = await textRes.json()
      setPolishedText(textData.polishedText)
    } catch (error) {
      setPolishedText(transcript)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: polishedText?.substring(0, 50) || 'Utkast',
          imageData,
          imageAnalysis,
          text: polishedText,
          platform,
        }),
      })
      alert('💾 Sparat som utkast!')
      await loadDrafts()
      resetFlow()
    } catch (error) {
      alert('❌ Kunde inte spara')
    }
  }

  const handleOpenDraft = (draft: Draft) => {
    setCurrentDraftId(draft.id)
    setImageData(draft.originalImage || undefined)
    setPolishedText(draft.generatedText)
    setPlatform(draft.platform as Platform)
    setStep('edit')
  }

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Radera detta utkast?')) return
    
    try {
      await fetch(`/api/drafts/${id}`, { method: 'DELETE' })
      await loadDrafts()
    } catch (error) {
      alert('❌ Kunde inte radera')
    }
  }

  const handleLinkedInConnect = () => {
    window.location.href = '/api/auth/linkedin'
  }

  const handlePostToLinkedIn = async () => {
    if (!polishedText) return

    setIsPosting(true)
    try {
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: polishedText,
          imageData,
        }),
      })

      if (!response.ok) throw new Error('Post failed')

      if (currentDraftId) {
        await fetch(`/api/drafts/${currentDraftId}`, { method: 'DELETE' })
        await loadDrafts()
      }

      alert('🎉 Postat på LinkedIn!')
      resetFlow()
    } catch (error) {
      console.error('Post error:', error)
      alert('❌ Kunde inte posta')
    } finally {
      setIsPosting(false)
    }
  }

  const resetFlow = () => {
    setStep('start')
    setImageData(undefined)
    setAudioTranscript(undefined)
    setPolishedText(undefined)
    setImageAnalysis(undefined)
    setCurrentDraftId(undefined)
    setTone('standard')
  }

  if (step === 'capture') {
    return <CameraCapture onCapture={handleImageCapture} onCancel={() => setStep('start')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Content Studio</h1>
          {step !== 'start' && <Button onClick={resetFlow}>Börja om</Button>}
        </div>

        {step === 'start' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Välj plattform</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={() => setPlatform('linkedin')} variant={platform === 'linkedin' ? 'default' : 'outline'}>
                  LinkedIn
                </Button>
                <Button onClick={() => setPlatform('instagram')} variant={platform === 'instagram' ? 'default' : 'outline'}>
                  Instagram
                </Button>
              </CardContent>
            </Card>

            {!linkedInConnected && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    Koppla LinkedIn
                  </CardTitle>
                  <CardDescription>
                    Koppla ditt LinkedIn-konto för att posta direkt från appen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleLinkedInConnect} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Linkedin className="h-5 w-5 mr-2" />
                    Koppla LinkedIn nu
                  </Button>
                </CardContent>
              </Card>
            )}

            {linkedInConnected && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">LinkedIn är kopplat - redo att posta!</span>
              </div>
            )}

            {drafts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sparade utkast ({drafts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {drafts.map(draft => (
                    <div key={draft.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {draft.originalImage && (
                        <img src={draft.originalImage} className="w-16 h-16 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{draft.title}</p>
                        <p className="text-xs text-gray-500">{new Date(draft.createdAt).toLocaleDateString('sv-SE')}</p>
                      </div>
                      <Button onClick={() => handleOpenDraft(draft)} variant="outline" className="h-9 px-3 text-sm">
                        Öppna
                      </Button>
                      <Button onClick={() => handleDeleteDraft(draft.id)} variant="outline" className="h-9 px-3 text-sm text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />Ta bild
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setStep('capture')} className="w-full" size="lg">
                  Öppna kamera
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'record' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Spela in ditt meddelande</h2>
            
            <Card className="bg-purple-50/50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-sm">Välj ton för AI-polering</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full p-3 rounded border bg-white"
                >
                  <option value="standard">Standard - Balanserad professionell</option>
                  <option value="professionell">🎯 Professionell - Seriös, fakta-driven</option>
                  <option value="inspirerande">✨ Inspirerande - Visionär, motiverande</option>
                  <option value="engagerande">🤝 Engagerande - Personlig, conversational</option>
                  <option value="tankeväckande">💡 Tankeväckande - Utmanande, frågande</option>
                  <option value="konkret">📊 Konkret - Praktisk, actionable</option>
                </select>
              </CardContent>
            </Card>

            <AudioRecorder onRecordingComplete={handleAudioComplete} />
            {imageData && <img src={imageData} className="w-full max-w-sm mx-auto rounded-lg" />}
          </div>
        )}

        {step === 'edit' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">
              {isProcessing ? 'AI bearbetar...' : currentDraftId ? 'Redigera utkast' : 'Klart att posta!'}
            </h2>
            {imageData && <img src={imageData} className="w-full max-w-md mx-auto rounded-lg" />}
            <Card>
              <CardContent className="p-6">
                {isProcessing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm">Laddar...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={polishedText}
                      onChange={(e) => setPolishedText(e.target.value)}
                      className="w-full min-h-[200px] p-4 rounded border resize-none"
                    />
                    <div className="flex gap-3">
                      {linkedInConnected && platform === 'linkedin' && (
                        <Button
                          onClick={handlePostToLinkedIn}
                          disabled={isPosting}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Linkedin className="h-5 w-5 mr-2" />
                          {isPosting ? 'Postar...' : 'Posta på LinkedIn'}
                        </Button>
                      )}
                      <Button
                        onClick={handleSaveDraft}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        💾 Spara utkast
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
