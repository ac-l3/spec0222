'use client';

import { useState, useEffect, useRef } from 'react';
import { Fira_Code } from 'next/font/google';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

/**
 * Matrix-style typewriter effect component
 * Displays text character by character with a blinking cursor
 */
export default function TypewriterEffect({ text, speed = 40 }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const charIndex = useRef(0);
  
  // Typing effect
  useEffect(() => {
    if (charIndex.current < text.length) {
      const char = text.charAt(charIndex.current);
      
      // Longer pauses at punctuation
      const delay = ['.', ',', '?', '!'].includes(char) ? speed * 4 : speed;
      
      const timer = setTimeout(() => {
        setDisplayText(current => current + char);
        charIndex.current += 1;
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [displayText, text, speed]);
  
  // Blinking cursor effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  return (
    <div className={`${firaCode.className} font-mono tracking-wider text-center`}>
      <span>{displayText}</span>
      <span 
        className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        style={{ color: '#C8FA1A' }}
      >
        ▌
      </span>
    </div>
  );
} 