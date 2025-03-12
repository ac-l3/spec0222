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
export default function TypewriterEffect({ text, speed = 40, delay = 0 }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isStarted, setIsStarted] = useState(delay === 0);
  const charIndex = useRef(0);
  
  // Handle the initial delay before starting the animation
  useEffect(() => {
    if (!isStarted && delay > 0) {
      const delayTimer = setTimeout(() => {
        setIsStarted(true);
      }, delay);
      
      return () => clearTimeout(delayTimer);
    }
  }, [delay, isStarted]);
  
  // Typing effect
  useEffect(() => {
    if (!isStarted) return;
    
    if (charIndex.current < text.length) {
      const char = text.charAt(charIndex.current);
      
      // Longer pauses at punctuation
      const pauseTime = ['.', ',', '?', '!'].includes(char) ? speed * 4 : speed;
      
      const timer = setTimeout(() => {
        setDisplayText(current => current + char);
        charIndex.current += 1;
      }, pauseTime);
      
      return () => clearTimeout(timer);
    }
  }, [displayText, text, speed, isStarted]);
  
  // Blinking cursor effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  return (
    <div className={`${firaCode.className} font-mono tracking-wider`}>
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