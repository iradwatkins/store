export const translations = {
  es: {
    comingSoon: 'Próximamente',
    mainTagline: 'Moda Femenina | República Dominicana',
    preparingSpecial: 'Estamos preparando algo especial para ti',
    emailPlaceholder: 'Tu correo electrónico',
    notifyButton: 'Notifícame',
    logoAlt: 'El Armario',
    fashionAlt: 'Moda',
    buyAndSell: 'Compra y vende tus artículos nuevos y usados',
  },
  en: {
    comingSoon: 'Coming Soon',
    mainTagline: 'Women\'s Fashion | Dominican Republic',
    preparingSpecial: 'We are preparing something special for you',
    emailPlaceholder: 'Your email address',
    notifyButton: 'Notify Me',
    logoAlt: 'El Armario',
    fashionAlt: 'Fashion',
    buyAndSell: 'Buy and sell your new and used items',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.es;
