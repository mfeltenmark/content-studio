import { NextRequest, NextResponse } from 'next/server'
import { polishText } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { text, platform, tone } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'No text' }, { status: 400 })
    }
    const polished = await polishText(text, platform || 'linkedin', tone)
    return NextResponse.json({ polishedText: polished })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Polish failed' }, { status: 500 })
  }
}
