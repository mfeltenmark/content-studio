import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`
  const scope = 'openid profile email w_member_social'
  const state = Math.random().toString(36).substring(7)

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

  return NextResponse.redirect(authUrl)
}
