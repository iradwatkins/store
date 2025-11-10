import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import Navigation from '@/components/navigation'
import CartDrawer from '@/components/CartDrawer'
import { SessionProvider } from './providers'
import { Toaster } from 'react-hot-toast'
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
            {/* Skip Navigation for Keyboard/Screen Reader Accessibility */}
            <a href="#main-content" className="skip-nav">
              Skip to main content
            </a>
            <Navigation />
            <main id="main-content" role="main">
              {children}
            </main>
            <CartDrawer />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
