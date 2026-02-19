'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

const CARD_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://din-app.vercel.app') + '/card'

const CONTACT = {
  name: 'Mikael Feltenmark',
  title: 'Chief Priority Officer',
  company: 'Tech & Change by Feltenmark AB',
  slogan: 'When everything is priority, nothing gets done.',
  phone: '+46 73 73 68 532',
  email: 'mikael@techchange.io',
  linkedin: 'https://www.linkedin.com/in/mikaelf/',
  linkedinHandle: 'mikaelf',
}

function generateVCard() {
  return `BEGIN:VCARD\nVERSION:3.0\nN:Feltenmark;Mikael;;;\nFN:${CONTACT.name}\nORG:${CONTACT.company}\nTITLE:${CONTACT.title}\nTEL;TYPE=CELL:${CONTACT.phone}\nEMAIL:${CONTACT.email}\nURL:${CONTACT.linkedin}\nNOTE:${CONTACT.slogan}\nEND:VCARD`
}

function downloadVCard() {
  const blob = new Blob([generateVCard()], { type: 'text/vcard' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mikael-feltenmark.vcf'
  a.click()
  URL.revokeObjectURL(url)
}

export default function CardPage() {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', note: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(CARD_URL, {
      width: 160,
      margin: 1,
      color: { dark: '#5e3a8c', light: '#ffffff' },
    }).then(setQrDataUrl)
    fetch('/api/card/views', { method: 'POST' }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/card/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setSubmitted(true)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f4f1f9; min-height: 100vh; font-family: 'DM Mono', monospace; }

        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px 48px; background: linear-gradient(160deg, #f4f1f9 0%, #ede8f5 100%); }

        .card { width: 100%; max-width: 400px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(94,58,140,0.12), 0 1px 4px rgba(94,58,140,0.06); opacity: 0; transform: translateY(16px); animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .card-header { background: linear-gradient(135deg, #5e3a8c 0%, #7c52a8 100%); padding: 32px 28px 28px; position: relative; overflow: hidden; }
        .photo-wrap { display: flex; justify-content: center; margin-bottom: 16px; } .photo { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.4); box-shadow: 0 2px 12px rgba(0,0,0,0.15); position: relative; z-index: 1; } .card-header::after { content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.06); }

        .name { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 400; color: #ffffff; line-height: 1.15; position: relative; z-index: 1; }
        .title { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: rgba(255,255,255,0.75); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 6px; position: relative; z-index: 1; }
        .company { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: rgba(255,255,255,0.5); margin-top: 2px; position: relative; z-index: 1; }

        .card-body { padding: 24px 28px 28px; }

        .slogan { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1rem; color: #7c52a8; line-height: 1.5; margin-bottom: 24px; padding-left: 12px; border-left: 2px solid #d4b8f0; }

        .contacts { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; border: 1px solid #ede8f5; border-radius: 14px; overflow: hidden; }

        .contact-row { display: flex; align-items: center; gap: 14px; text-decoration: none; padding: 14px 16px; background: #fff; border-bottom: 1px solid #ede8f5; transition: background 0.15s; }
        .contact-row:last-child { border-bottom: none; }
        .contact-row:hover { background: #f9f6fd; }

        .contact-icon { width: 36px; height: 36px; border-radius: 10px; background: #f4f0fb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .contact-icon svg { width: 16px; height: 16px; stroke: #5e3a8c; }

        .contact-text { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #2d1f42; }

        .qr-section { display: flex; justify-content: center; margin-bottom: 20px; }
        .qr-wrap { padding: 12px; background: #f9f6fd; border-radius: 14px; border: 1px solid #ede8f5; }
        .qr-wrap img { display: block; width: 100px; height: 100px; }

        .actions { display: flex; gap: 10px; }

        .btn-primary { flex: 1; padding: 14px 16px; background: #5e3a8c; border: none; border-radius: 12px; color: #ffffff; font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
        .btn-primary:hover { background: #4e2f78; }

        .btn-secondary { padding: 14px 18px; background: #f4f0fb; border: none; border-radius: 12px; color: #5e3a8c; font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
        .btn-secondary:hover { background: #ede8f5; }

        /* Form */
        .form-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; padding: 0 16px 24px; background: rgba(46,28,70,0.4); backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } }

        .form-sheet { width: 100%; max-width: 400px; background: #ffffff; border-radius: 20px; padding: 28px 24px; box-shadow: 0 8px 40px rgba(94,58,140,0.2); animation: slideUp 0.3s cubic-bezier(0.22,1,0.36,1); }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } }

        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 400; color: #2d1f42; margin-bottom: 4px; }
        .form-sub { font-family: 'DM Mono', monospace; font-size: 0.64rem; color: #9b8ab0; letter-spacing: 0.06em; margin-bottom: 20px; }

        .form-group { margin-bottom: 10px; }
        .form-input { width: 100%; padding: 12px 14px; background: #f9f6fd; border: 1px solid #ede8f5; border-radius: 10px; color: #2d1f42; font-family: 'DM Mono', monospace; font-size: 0.75rem; outline: none; transition: border-color 0.2s; }
        .form-input::placeholder { color: #c4b5d8; }
        .form-input:focus { border-color: #5e3a8c; }

        .form-actions { display: flex; gap: 8px; margin-top: 16px; }
        .btn-submit { flex: 1; padding: 13px; background: #5e3a8c; border: none; border-radius: 10px; color: #fff; font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; }
        .btn-submit:disabled { opacity: 0.5; }
        .btn-cancel { padding: 13px 18px; background: #f4f0fb; border: none; border-radius: 10px; color: #5e3a8c; font-family: 'DM Mono', monospace; font-size: 0.7rem; cursor: pointer; }

        .success-state { text-align: center; padding: 24px 0; }
        .success-icon { width: 48px; height: 48px; border-radius: 50%; background: #f4f0fb; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .success-text { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; color: #5e3a8c; }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="card-header"><div className="photo-wrap"><img src="/photo.png" alt="Mikael Feltenmark" className="photo" /></div>
            <div className="name">{CONTACT.name}</div>
            <div className="title">{CONTACT.title}</div>
            <div className="company">{CONTACT.company}</div>
          </div>

          <div className="card-body">
            <div className="slogan">"{CONTACT.slogan}"</div>

            <div className="contacts">
              <a href={`tel:${CONTACT.phone}`} className="contact-row">
                <div className="contact-icon"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <span className="contact-text">{CONTACT.phone}</span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className="contact-row">
                <div className="contact-icon"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <span className="contact-text">{CONTACT.email}</span>
              </a>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="contact-row">
                <div className="contact-icon"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <span className="contact-text">linkedin.com/in/{CONTACT.linkedinHandle}</span>
              </a>
            </div>

            <div className="qr-section">
              <div className="qr-wrap">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" />}
              </div>
            </div>

            <div className="actions">
              <button className="btn-primary" onClick={() => setShowForm(true)}>Spara kontakt</button>
              <button className="btn-secondary" onClick={downloadVCard}>vCard</button>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="form-sheet">
            {submitted ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5e3a8c" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="success-text">Tack! Jag hör av mig.</div>
              </div>
            ) : (
              <>
                <div className="form-title">Låt oss hålla kontakten</div>
                <div className="form-sub">Dina uppgifter stannar hos mig</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><input className="form-input" placeholder="Ditt namn" required value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} /></div>
                  <div className="form-group"><input type="email" className="form-input" placeholder="Email" required value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} /></div>
                  <div className="form-group"><input className="form-input" placeholder="Telefon (valfritt)" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} /></div>
                  <div className="form-group"><input className="form-input" placeholder="Var träffades vi?" value={formData.note} onChange={e => setFormData(p => ({...p, note: e.target.value}))} /></div>
                  <div className="form-actions">
                    <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Sparar...' : 'Skicka'}</button>
                    <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Avbryt</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
