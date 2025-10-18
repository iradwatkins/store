"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggleSimple } from "./theme-toggle"

export default function Navigation() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch cart count on mount and when cart is updated
  useEffect(() => {
    fetchCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [])

  const fetchCartCount = async () => {
    try {
      const response = await fetch("/api/cart")
      const data = await response.json()
      const count = data.cart?.items?.length || 0
      setCartItemCount(count)
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">
                Stepperslife Shop
              </span>
            </Link>

            {/* Desktop navigation links */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                href="/stores"
                className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-xl hover:bg-accent"
              >
                Stores
              </Link>
              <Link
                href="/products"
                className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-xl hover:bg-accent"
              >
                Products
              </Link>
              {!session?.user?.vendorStore && (
                <Link
                  href="/create-store"
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-xl hover:bg-accent"
                >
                  Become a Vendor
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products and stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>
          </div>

          {/* Auth buttons and theme toggle */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary hover:bg-accent rounded-full transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <ThemeToggleSimple />

            {status === "loading" ? (
              <div className="spinner-container">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors duration-200">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-popover rounded-2xl shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                      {session.user?.role === "STORE_OWNER" && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          Vendor
                        </span>
                      )}
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                    >
                      My Account
                    </Link>
                    {session.user?.vendorStore && (
                      <>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 font-medium"
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            </svg>
                            Vendor Dashboard
                          </div>
                        </Link>
                        <Link
                          href="/dashboard/products"
                          className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                        >
                          My Products
                        </Link>
                        <Link
                          href="/dashboard/orders"
                          className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                        >
                          My Orders
                        </Link>
                        <div className="border-t border-border my-1"></div>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        await signOut({
                          callbackUrl: "/",
                          redirect: true
                        })
                        // Force reload to clear any cached state
                        window.location.href = "/"
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200 rounded-b-2xl"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Login/Register
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-foreground hover:text-primary hover:bg-accent transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border mt-2">
            <div className="flex flex-col space-y-2 pt-2">
              {/* Search Bar - Mobile */}
              <form onSubmit={handleSearch} className="px-3 pb-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products and stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>

              <Link
                href="/cart"
                className="text-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>
              <Link
                href="/stores"
                className="text-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Stores
              </Link>
              <Link
                href="/products"
                className="text-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              {session?.user?.vendorStore ? (
                <>
                  <div className="border-t border-border my-2"></div>
                  <Link
                    href="/dashboard"
                    className="text-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 bg-indigo-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vendor Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/create-store"
                  className="text-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Vendor
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}