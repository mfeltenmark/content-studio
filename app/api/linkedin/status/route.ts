import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const auth = await prisma.linkedInAuth.findUnique({
      where: { userId: 'default' },
    })

    if (!auth) {
      return NextResponse.json({ connected: false })
    }

    const isConnected = new Date() < auth.expiresAt

    return NextResponse.json({ connected: isConnected })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ connected: false })
  }
}
