import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import type { NotificationType } from '#V2/atoms/requestStatusAtom.js';

interface NotificationFlashProps {
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
  color?: string;
}

const NotificationFlash = ({ title, type, phase, color = 'black' }: NotificationFlashProps) => {
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (phase === 'leaving') setIsIn(false);
  }, [phase]);

  const iconByType: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircleIcon className="h-4 w-4 rounded-full bg-white text-green-500" />,
    error: <XCircleIcon className="h-4 w-4 rounded-full bg-white text-error-500" />,
    warning: <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />,
    info: <InformationCircleIcon className="h-4 w-4 rounded-full bg-white text-blue-500" />,
  };

  return (
    <div
      data-testid="notification-flash"
      aria-hidden="true"
      className={`overflow-hidden transition-[max-width,opacity] duration-500 ease-out ${
        isIn ? 'max-w-48 opacity-100' : 'max-w-0 opacity-0'
      }`}
    >
      <div
        className={`flex items-center transition-transform duration-500 ease-out ${
          isIn ? 'translate-x-0' : 'translate-x-3 rtl:-translate-x-3'
        }`}
      >
        {iconByType[type]}
        <span
          className="inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium whitespace-nowrap"
          style={{ color }}
        >
          <span data-testid="notification-flash-title" className="block max-w-40 truncate">
            {title}
          </span>
        </span>
      </div>
    </div>
  );
};

export type { NotificationFlashProps };
export { NotificationFlash };
