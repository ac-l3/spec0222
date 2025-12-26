'use client';

import { useState, useEffect } from 'react';

/**
 * ErrorMessage component - Replaces alert() with a proper UI error display
 */
export default function ErrorMessage({ message, onDismiss, autoDismiss = true, autoDismissDelay = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, isVisible, onDismiss]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-slide-down">
        <div className="flex items-center gap-3 flex-1">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium flex-1">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onDismiss) {
              onDismiss();
            }
          }}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          aria-label="Dismiss error"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

