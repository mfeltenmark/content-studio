import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { name, email, phone, note } = await request.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    const { error } = await supabase.from('card_leads').insert({ name, email, phone: phone || null, note: note || null })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
