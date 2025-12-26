import { Karla } from 'next/font/google';
import { FrameInit } from './components/FrameInit';
import "./globals.css";

const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-karla',
});

export const metadata = {
  title: 'Enneagram Guesser',
  description: 'Analyze profiles to guess Enneagram types',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: 'yes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Mini App SDK is injected by Farcaster client when running as a miniapp */}
        {/* No need to load frame SDK CDN - using @farcaster/miniapp-sdk package */}
      </head>
      <body className={`${karla.variable} font-karla`}>
        {children}
        <FrameInit />
      </body>
    </html>
  );
}
