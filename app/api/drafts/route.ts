import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const draft = await prisma.draft.create({
      data: {
        title: body.title || 'Untitled',
        originalImage: body.imageData,
        imageAnalysis: body.imageAnalysis ? JSON.stringify(body.imageAnalysis) : null,
        generatedText: body.text,
        platform: body.platform,
        status: 'draft',
      },
    })
    return NextResponse.json(draft)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const drafts = await prisma.draft.findMany({
      where: { status: 'draft' },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(drafts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
