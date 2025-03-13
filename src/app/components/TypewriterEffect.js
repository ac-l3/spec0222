'use client';

import { useState, useEffect, useRef } from 'react';
import { Fira_Code } from 'next/font/google';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

/**
 * Fisher-Yates shuffle algorithm to randomize array order
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Matrix-style typewriter effect component with randomized rotating phrases
 * Displays sequences of phrases with typing animation
 */
export default function TypewriterEffect({ phrases, typeSpeed = 40, pauseDuration = 1500 }) {
  // Instead of shuffling all phrases, just pick one random phrase using a session-specific seed
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const charIndex = useRef(0);
  
  // Select a single random phrase on mount
  useEffect(() => {
    // Pick a random index based on current timestamp (day) as a stable seed for the session
    const date = new Date();
    const daySeed = date.getDate() + (date.getMonth() * 31); // Different seed each day
    const randomIndex = daySeed % phrases.length;
    setSelectedPhrase(phrases[randomIndex]);
  }, [phrases]);
  
  // Animation effect for typing
  useEffect(() => {
    // Don't start typing until phrase is selected
    if (!selectedPhrase) return;
    
    // Handle typing animation
    if (charIndex.current < selectedPhrase.length) {
      const char = selectedPhrase.charAt(charIndex.current);
      
      // Longer pauses at punctuation during typing
      const delay = ['.', ',', '?', '!', ':', ';', '-'].includes(char) ? typeSpeed * 4 : typeSpeed;
      
      const timer = setTimeout(() => {
        setDisplayText(current => current + char);
        charIndex.current += 1;
      }, delay);
      
      return () => clearTimeout(timer);
    }
    // Once the phrase is fully typed, just leave it displayed (no cycling)
  }, [displayText, selectedPhrase, typeSpeed]);
  
  // Blinking cursor effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  return (
    <div className={`${firaCode.className} font-mono tracking-wider text-left min-h-[5rem] overflow-hidden`}>
      <span className="whitespace-pre-line">{displayText}</span>
      <span 
        className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        style={{ color: '#C8FA1A', transform: 'scaleX(0.5)', display: 'inline-block' }}
      >
        ▌
      </span>
    </div>
  );
} 