'use client';

export default function BackgroundBlob({ className = '' }) {
  return (
    <div 
      className={`fixed w-full h-full pointer-events-none bg-[#191919] ${className}`}
      style={{
        background: '#191919',
        opacity: 1,
      }}
    >
      <div className="absolute w-full h-full" style={{ background: '#191919' }} />
    </div>
  );
} 