import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "El Armario - Moda Femenina",
  description: "Compra y vende tus artículos nuevos y usados. Moda Femenina en República Dominicana. Próximamente.",
  metadataBase: new URL("https://elarmario.com.do"),
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "El Armario - Moda Femenina",
    description: "Compra y vende tus artículos nuevos y usados. Moda Femenina en República Dominicana. Próximamente.",
    url: "https://elarmario.com.do",
    siteName: "El Armario",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "El Armario - Moda Femenina",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Armario - Moda Femenina",
    description: "Compra y vende tus artículos nuevos y usados. Moda Femenina en República Dominicana.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
