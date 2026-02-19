import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`)
  }

  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/linkedin/callback`,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      throw new Error('No access token')
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await prisma.linkedInAuth.upsert({
      where: { userId: 'default' },
      update: {
        accessToken: tokens.access_token,
        expiresAt,
        refreshToken: tokens.refresh_token,
      },
      create: {
        userId: 'default',
        accessToken: tokens.access_token,
        expiresAt,
        refreshToken: tokens.refresh_token,
      },
    })

    return NextResponse.redirect(`${baseUrl}/?linkedin=connected`)
  } catch (error) {
    console.error('LinkedIn auth error:', error)
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`)
  }
}
