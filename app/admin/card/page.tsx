'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = { id: string; name: string; email: string; phone: string | null; note: string | null; created_at: string }

export default function AdminCardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState({ total: 0, mobile: 0, desktop: 0, today: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [leadsRes, viewsRes] = await Promise.all([
        supabase.from('card_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('card_views').select('device, created_at'),
      ])
      if (leadsRes.data) setLeads(leadsRes.data)
      if (viewsRes.data) {
        const today = new Date().toISOString().slice(0, 10)
        setStats({
          total: viewsRes.data.length,
          mobile: viewsRes.data.filter(v => v.device === 'mobile').length,
          desktop: viewsRes.data.filter(v => v.device === 'desktop').length,
          today: viewsRes.data.filter(v => v.created_at.startsWith(today)).length,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f4f1f9; font-family: 'DM Mono', monospace; color: #2d1f42; }

        .admin { max-width: 800px; margin: 0 auto; padding: 48px 24px; }

        a.back { display: inline-block; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: #9b8ab0; text-decoration: none; margin-bottom: 32px; transition: color 0.2s; }
        a.back:hover { color: #5e3a8c; }

        .header { margin-bottom: 32px; }
        .header h1 { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 400; color: #2d1f42; margin-bottom: 4px; }
        .header p { font-size: 0.68rem; color: #9b8ab0; letter-spacing: 0.08em; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 36px; }
        .stat-card { background: #fff; border: 1px solid #ede8f5; border-radius: 14px; padding: 20px 16px; }
        .stat-label { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: #9b8ab0; margin-bottom: 8px; }
        .stat-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 400; color: #5e3a8c; line-height: 1; }

        .section-title { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8ab0; margin-bottom: 12px; }

        .leads-list { display: flex; flex-direction: column; gap: 8px; }

        .lead-row { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #ede8f5; border-radius: 12px; padding: 16px 20px; gap: 12px; transition: border-color 0.15s; }
        .lead-row:hover { border-color: #d4b8f0; }

        .lead-name { font-size: 0.82rem; color: #2d1f42; margin-bottom: 3px; font-weight: 400; }
        .lead-email { font-size: 0.67rem; color: #7c52a8; }
        .lead-note { font-size: 0.63rem; color: #9b8ab0; margin-top: 3px; font-style: italic; }
        .lead-date { font-size: 0.62rem; color: #9b8ab0; text-align: right; }
        .lead-phone { font-size: 0.65rem; color: #7c52a8; margin-top: 2px; text-align: right; }

        .empty { text-align: center; padding: 48px; color: #c4b5d8; font-size: 0.75rem; background: #fff; border: 1px solid #ede8f5; border-radius: 14px; }

        @media (max-width: 480px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="admin">
        <a href="/card" className="back">← Mitt visitkort</a>
        <div className="header">
          <h1>Card Dashboard</h1>
          <p>Leads & visningar — Mikael Feltenmark</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Totala visningar</div><div className="stat-value">{stats.total}</div></div>
          <div className="stat-card"><div className="stat-label">Idag</div><div className="stat-value">{stats.today}</div></div>
          <div className="stat-card"><div className="stat-label">Mobil</div><div className="stat-value">{stats.mobile}</div></div>
          <div className="stat-card"><div className="stat-label">Desktop</div><div className="stat-value">{stats.desktop}</div></div>
        </div>
        <div className="section-title">Sparade kontakter ({leads.length})</div>
        {loading ? (
          <div className="empty">Laddar...</div>
        ) : leads.length === 0 ? (
          <div className="empty">Inga kontakter ännu</div>
        ) : (
          <div className="leads-list">
            {leads.map(lead => (
              <div key={lead.id} className="lead-row">
                <div>
                  <div className="lead-name">{lead.name}</div>
                  <div className="lead-email">{lead.email}</div>
                  {lead.note && <div className="lead-note">{lead.note}</div>}
                </div>
                <div>
                  <div className="lead-date">{new Date(lead.created_at).toLocaleDateString('sv-SE')}</div>
                  {lead.phone && <div className="lead-phone">{lead.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
