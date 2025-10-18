'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function AnimatedHero() {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden min-h-[300px]"
          >
            <div className="relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-4"
              >
                Plan years-long<br />joy at your wishlist
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg mb-6 text-white/90"
              >
                Discover unique products from independent sellers
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  href="/products"
                  className="inline-block bg-white text-blue-900 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Shop Now
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.2, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute right-0 top-0 bottom-0 w-1/2"
            >
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop"
                alt="Shopping"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Side Images */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop"
                alt="Fashion"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop"
                alt="Jewelry"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
