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
  const [shuffledPhrases, setShuffledPhrases] = useState([]);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const charIndex = useRef(0);
  const pauseTimeout = useRef(null);
  
  // Randomize phrases on component mount
  useEffect(() => {
    setShuffledPhrases(shuffleArray(phrases));
  }, [phrases]);
  
  // Animation effect for typing
  useEffect(() => {
    // Don't start typing until phrases are shuffled
    if (shuffledPhrases.length === 0) return;
    
    const currentPhrase = shuffledPhrases[phraseIndex];
    
    // Handle typing animation
    if (charIndex.current < currentPhrase.length) {
      const char = currentPhrase.charAt(charIndex.current);
      
      // Longer pauses at punctuation during typing
      const delay = ['.', ',', '?', '!', ':', ';', '-'].includes(char) ? typeSpeed * 4 : typeSpeed;
      
      const timer = setTimeout(() => {
        setDisplayText(current => current + char);
        charIndex.current += 1;
      }, delay);
      
      return () => clearTimeout(timer);
    } 
    // Handle completed typing - pause then switch to next phrase
    else if (charIndex.current === currentPhrase.length) {
      pauseTimeout.current = setTimeout(() => {
        // Add a clear step with its own timeout to ensure full clearing before next phrase
        setDisplayText('');
        
        // Wait a bit before starting the next phrase to ensure clean transition
        setTimeout(() => {
          charIndex.current = 0;
          setPhraseIndex((current) => (current + 1) % shuffledPhrases.length);
        }, 100);
      }, pauseDuration);
      
      return () => {
        if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
      };
    }
  }, [displayText, shuffledPhrases, phraseIndex, typeSpeed, pauseDuration]);
  
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