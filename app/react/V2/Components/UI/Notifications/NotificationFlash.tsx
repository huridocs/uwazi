import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import type { NotificationType } from '#app/V2/atoms/requestStatusAtom.js';

interface NotificationFlashProps {
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
  /** Foreground (text) color resolved from the bar background */
  color?: string;
  /** Resolved bar background (rgb/rgba) for overlay strip + gradient */
  barBackground: string;
  onOpenPanel: () => void;
  controlsId: string;
  isPanelExpanded: boolean;
}

const NotificationFlash = ({
  title,
  type,
  phase,
  color = 'black',
  barBackground,
  onOpenPanel,
  controlsId,
  isPanelExpanded,
}: NotificationFlashProps) => {
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

  const iconByType: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircleIcon className="w-4 h-4 bg-white rounded-full text-green-500" />,
    error: <XCircleIcon className="w-4 h-4 bg-white rounded-full text-error-500" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />,
    info: <InformationCircleIcon className="w-4 h-4 bg-white rounded-full text-blue-500" />,
  };

  return (
    // Outer: animates max-width and opacity (the "container grow" effect); full height for bar strip
    <button
      type="button"
      data-testid="notification-flash"
      onClick={onOpenPanel}
      aria-label={`Open notifications — ${title}`}
      aria-controls={controlsId}
      aria-expanded={isPanelExpanded}
      className={`relative flex h-full min-h-0 cursor-pointer appearance-none overflow-hidden border-0 bg-transparent p-0 text-left transition-[max-width,opacity] duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
        isIn ? 'max-w-[12rem] opacity-100' : 'max-w-0 opacity-0'
      }`}
    >
      {/* Fade from transparent (outer / away from status dot) into bar color; mirror in RTL */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rtl:scale-x-[-1]"
        style={{
          backgroundImage: `linear-gradient(to right, transparent 0%, ${barBackground} 2.5rem, ${barBackground} 100%)`,
        }}
      />
      {/* Inner: animates the slide direction.
          LTR: dot is to the right → text enters from the right (translate-x-3 → 0).
          RTL: dot is to the left  → text enters from the left  (rtl:-translate-x-3 → 0).
          The DOM order + dir="rtl" on <html> puts the flash on the correct visual side automatically. */}
      <div
        aria-hidden
        className={`relative z-10 flex h-full min-h-0 items-center gap-1 ps-1.5 pe-3 transition-transform duration-500 ease-out ${
          isIn ? 'translate-x-0' : 'translate-x-3 rtl:-translate-x-3'
        }`}
      >
        {iconByType[type]}
        <span
          className="inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium whitespace-nowrap"
          style={{ color }}
        >
          <span data-testid="notification-flash-title" className="max-w-[10rem] truncate block">
            {title}
          </span>
        </span>
      </div>
    </button>
  );
};

export type { NotificationFlashProps };
export { NotificationFlash };
