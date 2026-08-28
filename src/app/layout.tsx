import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FAUVE - Haute Wardrobe & AI Try-On',
  description: 'Visual Wardrobe Management, Shared Access & Gemini AI Outfit Try-On Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FAUVE',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF8FAB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS standalone app mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FAUVE" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* Android / Chrome standalone app mode */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FAUVE" />

        {/* Theme colors */}
        <meta name="theme-color" content="#FF8FAB" />
        <meta name="msapplication-TileColor" content="#09090b" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* Prevent content adaptation */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}

