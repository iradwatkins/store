"use client"

import { useState } from "react"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Search,
  Home,
  Bell,
  Mail,
  User,
  Settings,
  Check,
  X
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ThemeDemoPage() {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border backdrop-blur-lg bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Twitter-Inspired Theme Demo</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-secondary rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-accent rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-destructive rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-chart-2 rounded-xl"></div>
              <p className="text-sm text-muted-foreground">Success</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-semibold">Heading 4</h4>
            <p className="text-base">
              This is a paragraph with standard text. The Twitter-inspired theme uses clean, readable typography
              with Open Sans as the primary font family.
            </p>
            <p className="text-sm text-muted-foreground">
              This is muted text, perfect for secondary information.
            </p>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-twitter">
              Primary Button
            </button>
            <button className="btn-twitter-outline">
              Outline Button
            </button>
            <button className="px-6 py-2 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 transition-all duration-200">
              Secondary
            </button>
            <button className="px-6 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-all duration-200">
              Destructive
            </button>
            <button className="px-6 py-2 rounded-full bg-chart-2 text-white font-semibold hover:bg-chart-2/90 transition-all duration-200">
              Success
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Cards & Posts</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tweet-like Card */}
            <div className="bg-card border border-border rounded-2xl p-4 hover:bg-accent/5 transition-colors duration-200">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">John Doe</h3>
                    <span className="text-muted-foreground text-sm">@johndoe · 2h</span>
                  </div>
                  <p className="mt-2">
                    Just launched our new Twitter-inspired theme! 🎨 The color scheme is clean and modern,
                    perfect for any social platform or modern web app.
                  </p>
                  <div className="flex items-center gap-6 mt-4">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 group">
                      <MessageCircle className="w-5 h-5 group-hover:bg-primary/10 rounded-full p-0.5" />
                      <span className="text-sm">12</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-chart-2 transition-colors duration-200 group">
                      <Repeat2 className="w-5 h-5 group-hover:bg-chart-2/10 rounded-full p-0.5" />
                      <span className="text-sm">5</span>
                    </button>
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`flex items-center gap-2 transition-colors duration-200 group ${
                        liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                      }`}
                    >
                      <Heart className={`w-5 h-5 group-hover:bg-destructive/10 rounded-full p-0.5 ${liked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{liked ? '25' : '24'}</span>
                    </button>
                    <button
                      onClick={() => setBookmarked(!bookmarked)}
                      className={`flex items-center gap-2 transition-colors duration-200 ${
                        bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-3">Trending Topics</h3>
              <div className="space-y-3">
                <div className="hover:bg-accent/50 -mx-2 px-2 py-2 rounded-xl transition-colors duration-200 cursor-pointer">
                  <p className="text-sm text-muted-foreground">Technology · Trending</p>
                  <p className="font-semibold">#TwitterTheme</p>
                  <p className="text-sm text-muted-foreground">12.5K posts</p>
                </div>
                <div className="hover:bg-accent/50 -mx-2 px-2 py-2 rounded-xl transition-colors duration-200 cursor-pointer">
                  <p className="text-sm text-muted-foreground">Design · Trending</p>
                  <p className="font-semibold">#UIDesign</p>
                  <p className="text-sm text-muted-foreground">8.2K posts</p>
                </div>
                <div className="hover:bg-accent/50 -mx-2 px-2 py-2 rounded-xl transition-colors duration-200 cursor-pointer">
                  <p className="text-sm text-muted-foreground">Development · Trending</p>
                  <p className="font-semibold">#NextJS</p>
                  <p className="text-sm text-muted-foreground">5.7K posts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Form Elements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search Input</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-2xl focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text Input</label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="input-twitter w-full outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Textarea</label>
                <textarea
                  placeholder="What's happening?"
                  className="w-full px-4 py-3 bg-input border border-border rounded-2xl focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 outline-none resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select</label>
                <select className="w-full px-4 py-3 bg-input border border-border rounded-2xl focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 outline-none">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Checkboxes</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-border focus:ring-ring" />
                    <span>Option 1</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-border focus:ring-ring" />
                    <span>Option 2</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Radio Buttons</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="radio" className="w-4 h-4 text-primary border-border focus:ring-ring" />
                    <span>Option 1</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="radio" className="w-4 h-4 text-primary border-border focus:ring-ring" />
                    <span>Option 2</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Navigation Example */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Navigation Example</h2>
          <div className="bg-sidebar border border-sidebar-border rounded-2xl p-4 max-w-xs">
            <nav className="space-y-2">
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Home className="w-6 h-6" />
                <span className="font-semibold">Home</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Search className="w-6 h-6" />
                <span className="font-semibold">Explore</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Bell className="w-6 h-6" />
                <span className="font-semibold">Notifications</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Mail className="w-6 h-6" />
                <span className="font-semibold">Messages</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <User className="w-6 h-6" />
                <span className="font-semibold">Profile</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-sidebar-accent transition-colors duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Settings className="w-6 h-6" />
                <span className="font-semibold">Settings</span>
              </a>
            </nav>
          </div>
        </section>

        {/* Alerts & Notifications */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Alerts & Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm">This is an info alert with Twitter blue styling</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-chart-2/10 border border-chart-2/20 rounded-2xl">
              <Check className="w-5 h-5 text-chart-2" />
              <p className="text-sm">Success! Your action was completed successfully</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-chart-3/10 border border-chart-3/20 rounded-2xl">
              <Bell className="w-5 h-5 text-chart-3" />
              <p className="text-sm">Warning: Please review this important information</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
              <X className="w-5 h-5 text-destructive" />
              <p className="text-sm">Error: Something went wrong, please try again</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}