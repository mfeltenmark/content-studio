import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()
    if (!imageData) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 })
    }
    const analysis = await analyzeImage(imageData)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
