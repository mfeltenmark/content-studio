'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = { id: string; name: string; email: string; phone: string | null; note: string | null; created_at: string }
type CrmState = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

export default function AdminCardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState({ total: 0, mobile: 0, desktop: 0, today: 0 })
  const [loading, setLoading] = useState(true)
  const [crmStates, setCrmStates] = useState<Record<string, CrmState>>({})

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

  async function pushToCRM(lead: Lead): Promise<CrmState> {
    const parts = lead.name.trim().split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || '-'

    try {
      const res = await fetch('https://leads.techchange.io/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: lead.email || null,
          phone: lead.phone || null,
          notes: lead.note ? `Card lead: ${lead.note}` : 'Lead from digital business card',
          title: '',
          linkedinUrl: '',
        }),
      })

      if (res.status === 201) return 'success'
      if (res.status === 409) return 'duplicate'

      const err = await res.text()
      console.error('CRM error:', res.status, err)
      return 'error'
    } catch (e) {
      console.error('CRM fetch failed:', e)
      return 'error'
    }
  }

  async function handleCRM(lead: Lead) {
    setCrmStates(s => ({ ...s, [lead.id]: 'loading' }))
    const result = await pushToCRM(lead)
    setCrmStates(s => ({ ...s, [lead.id]: result }))
  }

  function downloadLeadVCard(lead: Lead) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${lead.name}`,
      `EMAIL:${lead.email}`,
      lead.phone ? `TEL:${lead.phone}` : null,
      'END:VCARD',
    ].filter(Boolean).join('\n')
    const blob = new Blob([lines], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lead.name.toLowerCase().replace(/\s+/g, '-')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteLead(id: string) {
    await supabase.from('card_leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  function crmButtonLabel(state: CrmState) {
    switch (state) {
      case 'loading': return 'Saving...'
      case 'success': return '✓ In CRM'
      case 'duplicate': return 'Already in CRM'
      case 'error': return 'Failed'
      default: return '→ CRM'
    }
  }

  function crmButtonClass(state: CrmState) {
    switch (state) {
      case 'loading': return 'btn-lead btn-crm-loading'
      case 'success': return 'btn-lead btn-crm-success'
      case 'duplicate': return 'btn-lead btn-crm-duplicate'
      case 'error': return 'btn-lead btn-crm-error'
      default: return 'btn-lead btn-crm-idle'
    }
  }

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
        .header p { font-size: 0.875rem; color: #9b8ab0; letter-spacing: 0.08em; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 36px; }
        .stat-card { background: #fff; border: 1px solid #ede8f5; border-radius: 14px; padding: 20px 16px; }
        .stat-label { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: #9b8ab0; margin-bottom: 8px; }
        .stat-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 400; color: #5e3a8c; line-height: 1; }

        .section-title { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8ab0; margin-bottom: 12px; }

        .leads-list { display: flex; flex-direction: column; gap: 8px; }

        .lead-row { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border: 1px solid #ede8f5; border-radius: 12px; padding: 16px 20px; gap: 12px; transition: border-color 0.15s; }
        .lead-row:hover { border-color: #d4b8f0; }

        .lead-name { font-size: 1rem; color: #2d1f42; margin-bottom: 3px; font-weight: 400; }
        .lead-email { font-size: 0.875rem; color: #7c52a8; }
        .lead-note { font-size: 0.8rem; color: #9b8ab0; margin-top: 3px; font-style: italic; }
        .lead-date { font-size: 0.8rem; color: #9b8ab0; text-align: right; }
        .lead-phone { font-size: 0.875rem; color: #7c52a8; margin-top: 2px; text-align: right; }

        .lead-actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; justify-content: flex-end; }

        .btn-lead { padding: 5px 10px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; background: transparent; }

        .btn-vcf { border-color: #d4b8f0; color: #5e3a8c; }
        .btn-vcf:hover { background: #f4f0fb; }

        .btn-crm-idle { border-color: #d4b8f0; color: #5e3a8c; }
        .btn-crm-idle:hover { background: #f4f0fb; }
        .btn-crm-loading { border-color: #e0dce8; color: #9b8ab0; cursor: not-allowed; }
        .btn-crm-success { border-color: #86efac; color: #16a34a; cursor: not-allowed; }
        .btn-crm-duplicate { border-color: #d1d5db; color: #6b7280; cursor: not-allowed; }
        .btn-crm-error { border-color: #fca5a5; color: #dc2626; }
        .btn-crm-error:hover { background: #fff1f2; }

        .btn-delete { border-color: #fca5a5; color: #dc2626; }
        .btn-delete:hover { background: #fff1f2; }

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
            {leads.map(lead => {
              const crmState = crmStates[lead.id] || 'idle'
              return (
                <div key={lead.id} className="lead-row">
                  <div>
                    <div className="lead-name">{lead.name}</div>
                    <div className="lead-email">{lead.email}</div>
                    {lead.note && <div className="lead-note">{lead.note}</div>}
                  </div>
                  <div>
                    <div className="lead-date">{new Date(lead.created_at).toLocaleDateString('sv-SE')}</div>
                    {lead.phone && <div className="lead-phone">{lead.phone}</div>}
                    <div className="lead-actions">
                      <button className="btn-lead btn-vcf" onClick={() => downloadLeadVCard(lead)}>spara vCard</button>
                      <button
                        className={crmButtonClass(crmState)}
                        onClick={() => handleCRM(lead)}
                        disabled={crmState === 'loading' || crmState === 'success' || crmState === 'duplicate'}
                      >
                        {crmButtonLabel(crmState)}
                      </button>
                      <button className="btn-lead btn-delete" onClick={() => deleteLead(lead.id)}>radera</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
