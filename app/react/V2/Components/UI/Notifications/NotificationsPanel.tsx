import React, { Fragment, useEffect, useId, useMemo, useRef } from 'react';
import { Transition } from '@headlessui/react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';
import { type StatusNotification, useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';
import { EmptyState } from './EmptyState.js';
import { SectionLabel } from './SectionLabel.js';

type Bucket = 'today' | 'earlier';

const bucketOrder: Bucket[] = ['today', 'earlier'];

const getBucket = (notification: StatusNotification, todayStart: number): Bucket =>
  notification.timestamp.getTime() >= todayStart ? 'today' : 'earlier';

const getTodayStart = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const NotificationsPanel = () => {
  const {
    isPanelOpen,
    notifications,
    tasks,
    closePanel,
    removeNotification,
    removeTask,
    clearAll,
  } = useRequestStatus();
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const groupedNotifications = useMemo(() => {
    const groups: Record<Bucket, StatusNotification[]> = { today: [], earlier: [] };
    const todayStart = getTodayStart();
    notifications.forEach(notification =>
      groups[getBucket(notification, todayStart)].push(notification)
    );
    bucketOrder.forEach(bucket =>
      groups[bucket].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );
    return groups;
  }, [notifications]);
  const hasNotifications = notifications.length > 0;
  const itemCount = notifications.length + tasks.length;
  const hasClearable = hasNotifications || tasks.some(t => t.status !== 'running');

  useEffect(() => {
    if (!isPanelOpen) {
      previousFocus.current?.focus();
      previousFocus.current = null;
      return undefined;
    }
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && closePanel();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPanelOpen, closePanel]);

  const trapFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const [first] = focusable;
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <Transition show={isPanelOpen} as={Fragment}>
      <div
        data-testid="notifications-panel"
        className="tw-content fixed inset-0 z-60"
        style={{ colorScheme: themeMode }}
      >
        <Transition.Child
          as="div"
          data-testid="notifications-overlay"
          aria-hidden="true"
          onClick={closePanel}
          className="absolute inset-0 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(38, 30, 20, 0.18)' }}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        />
        <Transition.Child
          as="aside"
          ref={panelRef}
          id="notifications-panel-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={trapFocus}
          className="absolute inset-y-0 inset-e-0 flex w-92 max-w-[calc(100vw-2.5rem)] flex-col border-l border-border bg-paper shadow-xl transition-transform duration-300 ease-out"
          enterFrom="translate-x-full rtl:-translate-x-full"
          enterTo="translate-x-0"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full rtl:-translate-x-full"
        >
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <h1 id={titleId} className="text-base font-bold text-ink">
              <Translate>Notifications</Translate>
            </h1>
            {itemCount > 0 && (
              <span
                className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums text-white"
                style={{ backgroundColor: 'var(--color-theme-accent-supporting)' }}
              >
                {itemCount}
              </span>
            )}
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close"
              className="ms-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-warm hover:text-ink-secondary"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-warm">
            {tasks.length > 0 && (
              <section>
                <SectionLabel>
                  <Translate>Tasks</Translate> · {tasks.length}
                </SectionLabel>
                <ul className="flex flex-col gap-2 px-3 pb-3">
                  {tasks.map(task => (
                    <li key={task.id}>
                      <TaskItem task={task} onRemove={removeTask} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!hasNotifications ? (
              <EmptyState />
            ) : (
              bucketOrder.map(bucket =>
                groupedNotifications[bucket].length === 0 ? null : (
                  <section key={bucket}>
                    <SectionLabel>
                      {bucket === 'today' ? (
                        <Translate>Today</Translate>
                      ) : (
                        <Translate>Earlier</Translate>
                      )}
                    </SectionLabel>
                    <ul className="flex flex-col gap-2 px-3 pb-3">
                      {groupedNotifications[bucket].map(notification => (
                        <li key={notification.id}>
                          <NotificationItem
                            notification={notification}
                            onDismiss={removeNotification}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              )
            )}
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <button
              type="button"
              onClick={clearAll}
              disabled={!hasClearable}
              className="h-9 w-full rounded-md border border-border bg-paper text-[13px] font-medium text-ink-secondary transition-colors hover:bg-warm disabled:cursor-default disabled:opacity-40"
            >
              <Translate>Clear all</Translate>
            </button>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export { NotificationsPanel };
