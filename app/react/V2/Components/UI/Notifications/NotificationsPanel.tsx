import React, { useId, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Drawer } from '#V2/Components/UI/Drawer.js';
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

  return (
    <Drawer
      open={isPanelOpen}
      onClose={closePanel}
      scope="fixed"
      motion="spring"
      id="notifications-panel-dialog"
      labelledBy={titleId}
      wrapperTestId="notifications-panel"
      overlayTestId="notifications-overlay"
      colorScheme={themeMode}
      bodyClassName="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-warm"
      header={
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
      }
      footer={
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
      }
    >
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
                {bucket === 'today' ? <Translate>Today</Translate> : <Translate>Earlier</Translate>}
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
    </Drawer>
  );
};

export { NotificationsPanel };
