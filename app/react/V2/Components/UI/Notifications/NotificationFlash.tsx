import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import { NotificationType } from '#app/V2/atoms/requestStatusAtom.js';

interface NotificationFlashProps {
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
  color?: string;
}

const NotificationFlash = ({ title, type, phase, color = 'black' }: NotificationFlashProps) => {
  const [isIn, setIsIn] = useState(false);
  const typeLabel: Record<NotificationType, string> = {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    info: 'Information',
  };
  const announcement = `${typeLabel[type]}: ${title}`;
  const isError = type === 'error';

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

  const iconByType: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircleIcon className="w-4 h-4 bg-white rounded-full text-green-500" />,
    error: <XCircleIcon className="w-4 h-4 bg-white rounded-full text-pink-500" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />,
    info: <InformationCircleIcon className="w-4 h-4 bg-white rounded-full text-blue-500" />,
  };

  return (
    // Outer: animates max-width and opacity (the "container grow" effect)
    <div
      data-testid="notification-flash"
      aria-hidden="true"
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
        {iconByType[type]}
        <span
          className="inline-flex items-center px-1 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
          style={{ color }}
        >
          <span data-testid="notification-flash-title" className="max-w-[10rem] truncate block">
            {announcement}
          </span>
        </span>
      </div>
    </div>
  );
};

export type { NotificationFlashProps };
export { NotificationFlash };
