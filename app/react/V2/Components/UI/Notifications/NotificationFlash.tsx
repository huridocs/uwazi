import { XCircleIcon } from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';

interface NotificationFlashProps {
  title: string;
  type: 'error' | 'warning';
  phase: 'showing' | 'leaving';
}

const NotificationFlash = ({ title, type, phase }: NotificationFlashProps) => {
  const [isIn, setIsIn] = useState(false);

  // After mount, trigger the enter transition on the next animation frame
  // so the browser renders the collapsed initial state first.
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // When the parent signals 'leaving', reverse the transition.
  useEffect(() => {
    if (phase === 'leaving') setIsIn(false);
  }, [phase]);

  return (
    // Outer: animates max-width and opacity (the "container grow" effect)
    <div
      className={`overflow-hidden transition-[max-width,opacity] duration-500 ease-out ${
        isIn ? 'max-w-[12rem] opacity-100' : 'max-w-0 opacity-0'
      }`}
    >
      {/* Inner: animates the slide direction.
          LTR: dot is to the right → text enters from the right (translate-x-3 → 0).
          RTL: dot is to the left  → text enters from the left  (rtl:-translate-x-3 → 0).
          The DOM order + dir="rtl" on <html> puts the flash on the correct visual side automatically. */}
      <div
        className={`flex items-center transition-transform duration-500 ease-out ${
          isIn ? 'translate-x-0' : 'translate-x-3 rtl:-translate-x-3'
        }`}
      >
        {type === 'error' ? (
          <XCircleIcon className="w-4 h-4 text-pink-500" />
        ) : (
          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
        )}
        <span
          className={`inline-flex items-center px-1 py-0.5 rounded-md text-xs font-medium whitespace-nowrap`}
          role="status"
          aria-live="polite"
        >
          <span className="max-w-[10rem] truncate block">{title}</span>
        </span>
      </div>
    </div>
  );
};

export type { NotificationFlashProps };
export { NotificationFlash };
