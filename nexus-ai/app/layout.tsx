// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head>
        <title>Nexus.ai - AI-powered notes for STEM</title>
        <meta name="description" content="AI-powered note-taking for STEM students" />
      </head>
      <body className="bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}