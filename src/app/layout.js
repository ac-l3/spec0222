import { Karla } from 'next/font/google';
import Script from "next/script";
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
  maximumScale: 1,
  userScalable: 'no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${karla.variable} font-karla`}>
        <>
          {children}
          <FrameInit />
        </>
      </body>
    </html>
  );
}
