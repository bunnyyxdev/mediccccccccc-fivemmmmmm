import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
});

export const metadata: Metadata = {
  title: 'ระบบหมอ Preview City',
  description: 'ระบบจัดการสำหรับแพทย์ Preview City',
  manifest: '/manifest.json?v=3',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Preview City Medic',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <head>
        <link rel="manifest" href="/manifest.json?v=3" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Preview City Medic" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={notoSansThai.className}>
        {/* Mourning Ribbon - Top Right */}
        <img 
          src="https://raw.githubusercontent.com/appzstory/appzstory-ribbon/main/black_ribbon_top_right.png" 
          alt="Black Ribbon Top Right" 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '80px',
            opacity: 0.9,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
        {children}
        <Toaster position="top-right" />
        {/* Clear service worker and caches in development */}
        <Script id="sw-unregister" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              // Unregister all service workers
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                }
              });
              
              // Clear all caches
              if ('caches' in window) {
                caches.keys().then(function(cacheNames) {
                  return Promise.all(
                    cacheNames.map(function(cacheName) {
                      return caches.delete(cacheName);
                    })
                  );
                });
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
