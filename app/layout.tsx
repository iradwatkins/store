import type { Metadata } from 'next'
import { SessionProvider } from './providers'
import { ThemeProvider } from '@/components/theme-provider'
import Navigation from '@/components/navigation'
import CartDrawer from '@/components/CartDrawer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stepperslife Shop',
  description: 'Shop for the latest stepping gear and merchandise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <Navigation />
            {children}
            <CartDrawer />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
