import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CIRO — Crisis Intelligence & Response Orchestrator',
  description:
    'Agentic AI system for real-time urban crisis detection and coordinated response. Built for Pakistan metropolitan cities.',
  keywords: 'crisis management, flood, AI, Islamabad, Karachi, Lahore, emergency response',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
