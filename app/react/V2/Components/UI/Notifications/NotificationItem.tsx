import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/20/solid';
import { NotificationType, StatusNotification } from '#V2/atoms/requestStatusAtom.js';

interface NotificationItemProps {
  notification: StatusNotification;
  onDismiss: (id: string) => void;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 shrink-0" />,
  error: <XCircleIcon className="w-5 h-5 text-pink-500 shrink-0" />,
  info: <InformationCircleIcon className="w-5 h-5 text-indigo-500 shrink-0" />,
};

const borderMap: Record<NotificationType, string> = {
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  error: 'border-pink-200 bg-pink-50',
  info: 'border-indigo-200 bg-indigo-50',
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  return date.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${borderMap[notification.type]}`}
      role="listitem"
    >
      {iconMap[notification.type]}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 break-words">{notification.title}</p>

        {notification.message && (
          <p className="mt-1 text-xs text-gray-600 break-words">{notification.message}</p>
        )}

        {notification.details && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setDetailsOpen(o => !o)}
              aria-expanded={detailsOpen}
              className="flex items-center gap-0.5 text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            >
              {detailsOpen ? (
                <ChevronUpIcon className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="w-3 h-3" aria-hidden="true" />
              )}
              {detailsOpen ? 'Hide details' : 'Show details'}
            </button>

            {detailsOpen && (
              <pre className="mt-1.5 text-xs text-gray-500 bg-white/70 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {notification.details}
              </pre>
            )}
          </div>
        )}

        <p className="mt-1 text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 p-0.5 rounded cursor-pointer hover:bg-gray-200 transition-colors"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

export type { NotificationItemProps };
export { NotificationItem };
