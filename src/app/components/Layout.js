'use client';

import BackgroundBlob from './BackgroundBlob';
import Wave from './Wave';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundBlob />
      <Wave />
      <main className="relative max-w-[1024px] mx-auto flex flex-col items-center p-8">
        {children}
      </main>
    </div>
  );
} 