// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import '/app/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}