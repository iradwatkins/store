'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-6 right-6 z-50"
    >
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-md border-2 border-primary/30 rounded-full p-2 shadow-lg">
        <Languages className="w-5 h-5 text-primary ml-2" />
        <button
          onClick={() => setLanguage('es')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            language === 'es'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            language === 'en'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          EN
        </button>
      </div>
    </motion.div>
  );
}
