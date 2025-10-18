'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function AnimatedCTA() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-4"
        >
          Ready to start your store?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl mb-8 text-white/90"
        >
          Join thousands of independent sellers on Stepperslife
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/create-store"
            className="inline-block bg-white text-blue-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Open Your Shop
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
