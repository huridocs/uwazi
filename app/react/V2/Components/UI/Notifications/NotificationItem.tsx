import React, { useId, useState } from 'react';
import {
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid';
import { type NotificationType, type StatusNotification } from '#V2/atoms/requestStatusAtom.js';
import { Translate } from '#app/I18N/index.js';

interface NotificationItemProps {
  notification: StatusNotification;
  isUnread: boolean;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-[17px] w-[17px] shrink-0 text-success" />,
  warning: (
    <ExclamationTriangleIcon className="h-[17px] w-[17px] shrink-0 text-(--color-theme-warning)" />
  ),
  error: <XCircleIcon className="h-[17px] w-[17px] shrink-0 text-emphasis" />,
  info: <InformationCircleIcon className="h-[17px] w-[17px] shrink-0 text-supporting" />,
};

const cardStyle: Record<NotificationType, string> = {
  success:
    'border-[color-mix(in_srgb,var(--color-theme-success)_20%,transparent)] bg-success-light',
  warning:
    'border-[color-mix(in_srgb,var(--color-theme-warning)_25%,transparent)] bg-warning-light',
  error:
    'border-[color-mix(in_srgb,var(--color-theme-accent-emphasis)_20%,transparent)] bg-emphasis-tint',
  info: 'border-[color-mix(in_srgb,var(--color-theme-accent-supporting)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-theme-accent-supporting)_10%,var(--color-theme-bg-surface))]',
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

const NotificationItem = ({ notification, isUnread, onDismiss, onRead }: NotificationItemProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const titleId = useId();
  const messageId = useId();
  const timestampId = useId();
  const detailsToggleId = useId();
  const detailsDescription = notification.message ? `${messageId} ${timestampId}` : timestampId;

  return (
    <article
      aria-labelledby={titleId}
      aria-describedby={detailsDescription}
      className={`group relative flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-opacity ${cardStyle[notification.type]} ${isUnread ? '' : 'opacity-75 hover:opacity-100'}`}
    >
      <span className="mt-px">{iconMap[notification.type]}</span>

      <div className="min-w-0 flex-1 overflow-hidden pr-5">
        <div className="flex items-center gap-1.5">
          {isUnread && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-theme-accent-supporting)" />
          )}
          <p id={titleId} className="wrap-break-word text-[13px] font-medium text-ink">
            {notification.title}
          </p>
        </div>

        {notification.message && (
          <p id={messageId} className="mt-0.5 wrap-break-word text-[12px] text-ink-secondary">
            {notification.message}
          </p>
        )}

        {notification.details && (
          <div className="mt-1">
            <button
              type="button"
              id={detailsToggleId}
              aria-expanded={detailsOpen}
              aria-controls={detailsId}
              onClick={event => {
                event.stopPropagation();
                setDetailsOpen(o => !o);
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
            >
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {detailsOpen ? (
                <Translate>Hide details</Translate>
              ) : (
                <Translate>Show details</Translate>
              )}
            </button>

            {detailsOpen && (
              <pre
                id={detailsId}
                aria-labelledby={detailsToggleId}
                className="mt-1.5 overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-md border border-border-soft bg-[color-mix(in_srgb,var(--color-theme-text-primary)_4%,transparent)] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink-secondary"
              >
                {notification.details}
              </pre>
            )}
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-2">
          <p id={timestampId} className="text-[11px] text-ink-tertiary">
            {formatTimestamp(notification.timestamp)}
          </p>
          {isUnread && (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                onRead(notification.id);
              }}
              className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-[color-mix(in_srgb,var(--color-theme-text-primary)_5%,transparent)]"
              aria-label="Mark read"
              title="Mark read"
            >
              <CheckIcon className="h-[13px] w-[13px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onDismiss(notification.id);
        }}
        className="absolute right-2.5 top-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted opacity-0 transition-opacity hover:bg-[color-mix(in_srgb,var(--color-theme-text-primary)_5%,transparent)] group-hover:opacity-100 focus:opacity-100"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-[13px] w-[13px]" aria-hidden="true" />
      </button>
    </article>
  );
};

export type { NotificationItemProps };
export { NotificationItem };
