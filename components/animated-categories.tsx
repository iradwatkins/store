'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const categories = [
  { name: 'Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop' },
  { name: 'Home & Living', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop' },
  { name: 'Clothing', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=400&fit=crop' },
  { name: 'Art & Collectibles', image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=400&fit=crop' },
  { name: 'Craft Supplies', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop' },
  { name: 'Bath & Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' },
  { name: 'Wedding', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop' },
  { name: 'Paper & Party', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop' },
  { name: 'Pet Supplies', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop' },
  { name: 'Toys & Games', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop' },
  { name: 'Vintage', image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400&h=400&fit=crop' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export function AnimatedCategories() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-foreground mb-6"
      >
        Shop by category
      </motion.h2>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        {categories.map((category) => (
          <motion.div key={category.name} variants={item}>
            <Link
              href={`/category/${category.name.toLowerCase()}`}
              className="group block"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-full overflow-hidden mb-2 ring-2 ring-border group-hover:ring-primary transition-all duration-300"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
              <p className="text-sm text-center font-medium text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
