'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

// Unsplash women's fashion images (curated collection)
const fashionImages = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80',
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
  'https://images.unsplash.com/photo-1558769132-cb1aea27c267?w=400&q=80',
  'https://images.unsplash.com/photo-1467632499275-7a693a761056?w=400&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80',
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 2,
    640: 1
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Animated Masonry Background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-full gap-4 p-4"
          columnClassName="masonry-column"
        >
          {fashionImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 5,
              }}
              className="mb-4 overflow-hidden rounded-2xl"
            >
              <motion.img
                src={image}
                alt={`${t.fashionAlt} ${index + 1}`}
                className="w-full h-auto object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </Masonry>
      </motion.div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
        <div className="text-center max-w-4xl">
          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="inline-block bg-primary/20 backdrop-blur-sm px-6 py-3 rounded-full text-primary font-medium text-lg border-2 border-primary">
              {t.comingSoon}
            </span>
          </motion.div>

          {/* Main Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              type: 'spring',
              stiffness: 100,
            }}
            className="mb-6 flex justify-center"
          >
            <Image
              src="/logo.png"
              alt={t.logoAlt}
              width={800}
              height={400}
              className="w-full max-w-3xl h-auto"
              priority
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl md:text-3xl text-foreground/80 mb-12 font-light"
          >
            {t.mainTagline}
          </motion.p>

          {/* Animated Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center justify-center gap-8"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
              />
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16"
          >
            <p className="text-lg text-foreground/70 mb-6">
              {t.preparingSpecial}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="px-6 py-4 rounded-full bg-card border-2 border-primary/30 text-foreground focus:outline-none focus:border-primary transition-colors w-full sm:w-80"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                {t.notifyButton}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Fashion Icons */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            {['👗', '👠', '👜', '💄', '👒', '💅'][i]}
          </motion.div>
        ))}
      </div>

      <style jsx global>{`
        .masonry-column {
          background-clip: padding-box;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
