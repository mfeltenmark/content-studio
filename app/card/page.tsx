'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import './card.css'

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
  return `BEGIN:VCARD\nVERSION:3.0\nN:Feltenmark;Mikael;;;\nFN:${CONTACT.name}\nORG:${CONTACT.company}\nTITLE:${CONTACT.title}\nTEL;TYPE=CELL:${CONTACT.phone}\nEMAIL:${CONTACT.email}\nURL:${CONTACT.linkedin}\nURL;type=WORK:https://techchange.io\nNOTE:${CONTACT.slogan}\nEND:VCARD`
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
      <div className="page">
        <div className="card">
          <div className="card-header">
            <div className="photo-wrap"><img src="/photo.jpg" alt="Mikael Feltenmark" className="photo" /></div>
            <div className="header-text">
              <div className="name">{CONTACT.name}</div>
              <div className="title">{CONTACT.title}</div>
              <div className="company">{CONTACT.company}</div>
            </div>
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
              <a href="https://techchange.io" target="_blank" rel="noreferrer" className="contact-row">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="contact-text">techchange.io</span>
              </a>
            </div>

            <div className="qr-section">
              <div className="qr-wrap">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" />}
              </div>
            </div>

            <div className="actions">
              <button className="btn-primary" onClick={() => setShowForm(true)}>Save contact</button>
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
                <div className="success-text">Thank you! I'll be in touch.</div>
              </div>
            ) : (
              <>
                <div className="form-title">Let's stay in touch</div>
                <div className="form-sub">Your details stay with me</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><input className="form-input" placeholder="Your name" required value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} /></div>
                  <div className="form-group"><input type="email" className="form-input" placeholder="Email" required value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} /></div>
                  <div className="form-group"><input className="form-input" placeholder="Phone (optional)" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} /></div>
                  <div className="form-group"><input className="form-input" placeholder="Where did we meet?" value={formData.note} onChange={e => setFormData(p => ({...p, note: e.target.value}))} /></div>
                  <div className="form-actions">
                    <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Saving...' : 'Send'}</button>
                    <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
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
