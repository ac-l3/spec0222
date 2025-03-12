'use client';

import { useState, useEffect, useRef } from 'react';
import { Fira_Code } from 'next/font/google';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

/**
 * Matrix-style typewriter effect component with rotating phrases
 * Displays sequences of phrases with typing and deletion animations
 */
export default function TypewriterEffect({ phrases, typeSpeed = 40, deleteSpeed = 15, pauseDuration = 1500 }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const charIndex = useRef(0);
  const pauseTimeout = useRef(null);
  
  // Animation effect for typing and deleting
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    
    // Handle typing animation
    if (!isDeleting && charIndex.current < currentPhrase.length) {
      const char = currentPhrase.charAt(charIndex.current);
      
      // Longer pauses at punctuation during typing
      const delay = ['.', ',', '?', '!', ':', ';', '-'].includes(char) ? typeSpeed * 4 : typeSpeed;
      
      const timer = setTimeout(() => {
        setDisplayText(current => current + char);
        charIndex.current += 1;
      }, delay);
      
      return () => clearTimeout(timer);
    } 
    // Handle completed typing - pause before deletion
    else if (!isDeleting && charIndex.current === currentPhrase.length) {
      pauseTimeout.current = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      
      return () => clearTimeout(pauseTimeout.current);
    } 
    // Handle deletion animation
    else if (isDeleting && displayText.length > 0) {
      const timer = setTimeout(() => {
        setDisplayText(current => current.slice(0, -1));
        charIndex.current -= 1;
      }, deleteSpeed);
      
      return () => clearTimeout(timer);
    } 
    // Handle completed deletion - move to next phrase
    else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setPhraseIndex((current) => (current + 1) % phrases.length);
      charIndex.current = 0;
      
      // Add a small pause after deletion before starting the next phrase
      const timer = setTimeout(() => {}, 300);
      return () => clearTimeout(timer);
    }
  }, [displayText, phrases, phraseIndex, isDeleting, typeSpeed, deleteSpeed, pauseDuration]);
  
  // Blinking cursor effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  return (
    <div className={`${firaCode.className} font-mono tracking-wider text-center min-h-[3.5rem]`}>
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