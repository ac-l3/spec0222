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
export default function TypewriterEffect({ phrases, typeSpeed = 50, pauseDuration = 2000 }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef(null);

  // Effect for the typing animation
  useEffect(() => {
    if (phrases.length === 0) return;

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);

    const currentPhrase = phrases[currentPhraseIndex];

    if (isTyping) {
      // Still typing the current phrase
      if (displayText.length < currentPhrase.length) {
        const nextChar = currentPhrase.charAt(displayText.length);
        const delay = ['.', ',', '?', '!', ':', ';', '-'].includes(nextChar) ? typeSpeed * 4 : typeSpeed;
        
        timerRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, delay);
      } else {
        // Finished typing the current phrase, pause before erasing
        setIsTyping(false);
        setIsDone(true);
        timerRef.current = setTimeout(() => {
          setIsDone(false);
        }, pauseDuration);
      }
    } else if (!isDone) {
      // Erasing the current phrase
      if (displayText.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        }, typeSpeed / 2);
      } else {
        // Fully erased, move to next phrase
        setIsTyping(true);
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayText, isTyping, isDone, currentPhraseIndex, phrases, typeSpeed, pauseDuration]);

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