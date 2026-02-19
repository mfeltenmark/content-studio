import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Content Studio',
  description: 'AI-powered content creation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
