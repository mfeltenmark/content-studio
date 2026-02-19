import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const h = headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = h.get('user-agent') || ''
    const referer = h.get('referer') || ''
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop'
    await supabase.from('card_views').insert({ ip, device, referer })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
