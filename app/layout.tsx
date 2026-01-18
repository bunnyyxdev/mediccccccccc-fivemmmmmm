import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
});

export const metadata: Metadata = {
  title: 'ระบบหมอ Biz City',
  description: 'ระบบจัดการสำหรับแพทย์ Biz City',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className={notoSansThai.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
