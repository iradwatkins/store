'use client'

import { motion } from 'framer-motion'

interface AnimatedSectionHeaderProps {
  title: string
  subtitle?: string
  link?: {
    href: string
    text: string
  }
}

export function AnimatedSectionHeader({ title, subtitle, link }: AnimatedSectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
      {link && (
        <motion.a
          href={link.href}
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          {link.text} →
        </motion.a>
      )}
    </motion.div>
  )
}
