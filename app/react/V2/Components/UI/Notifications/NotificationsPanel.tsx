import React, { useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { Button } from '#V2/Components/UI/Button.js';
import {
  type NotificationType,
  type StatusNotification,
  useRequestStatus,
} from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';
import { EmptyState } from './EmptyState.js';
import { FilterPill } from './FilterPill.js';
import { SectionLabel } from './SectionLabel.js';
import { Translate } from '#app/I18N/index.js';

type Filter = 'all' | 'unread';
type Bucket = 'new' | 'today' | 'earlier';

const bucketOrder: Bucket[] = ['new', 'today', 'earlier'];
const severityRank: Record<NotificationType, number> = {
  error: 3,
  warning: 2,
  info: 1,
  success: 0,
};

const getBucket = (
  notification: StatusNotification,
  isUnread: boolean,
  todayStart: number
): Bucket => {
  if (isUnread) return 'new';
  return notification.timestamp.getTime() >= todayStart ? 'today' : 'earlier';
};

const NotificationsPanel = () => {
  const {
    isPanelOpen,
    notifications,
    unreadNotificationIds,
    unreadNotificationCount,
    tasks,
    closePanel,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    removeTask,
    clearAll,
  } = useRequestStatus();

  const hasClearable = notifications.length > 0 || tasks.some(t => t.status !== 'running');
  const [filter, setFilter] = useState<Filter>('all');
  const unreadIds = useMemo(() => new Set(unreadNotificationIds), [unreadNotificationIds]);
  const todayStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }, []);
  const groupedNotifications = useMemo(() => {
    const groups: Record<Bucket, StatusNotification[]> = { new: [], today: [], earlier: [] };
    notifications
      .filter(notification => filter === 'all' || unreadIds.has(notification.id))
      .forEach(notification => {
        groups[getBucket(notification, unreadIds.has(notification.id), todayStart)].push(
          notification
        );
      });
    groups.new.sort(
      (a, b) =>
        severityRank[b.type] - severityRank[a.type] || b.timestamp.getTime() - a.timestamp.getTime()
    );
    groups.today.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    groups.earlier.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return groups;
  }, [filter, notifications, todayStart, unreadIds]);
  const orderedNotifications = useMemo(
    () => bucketOrder.flatMap(bucket => groupedNotifications[bucket]),
    [groupedNotifications]
  );
  const hasVisibleNotifications = orderedNotifications.length > 0;

  const title = (
    <span className="flex items-center gap-2">
      <Translate className="capitalize">Notifications</Translate>
      {unreadNotificationCount > 0 && (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-theme-accent-supporting) px-1.5 text-[11px] font-bold tabular-nums text-parchment">
          {unreadNotificationCount}
        </span>
      )}
    </span>
  );

  return (
    <div data-testid="notifications-panel" className="tw-content">
      <Sidepanel
        isOpen={isPanelOpen}
        closeSidepanelFunction={closePanel}
        title={title}
        size="medium"
        withOverlay
        panelId="notifications-panel-dialog"
      >
        <Sidepanel.Body className="flex flex-col overflow-y-auto bg-warm p-0!">
          <div className="shrink-0 border-b border-border bg-paper px-4 pb-2.5">
            <div className="flex items-center gap-1">
              <FilterPill
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                label={<Translate>All</Translate>}
                count={notifications.length}
              />
              <FilterPill
                active={filter === 'unread'}
                onClick={() => setFilter('unread')}
                label={<Translate>Unread</Translate>}
                count={unreadNotificationCount}
              />
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-ink-secondary transition-colors hover:bg-warm"
                >
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <Translate>Mark all read</Translate>
                </button>
              )}
            </div>
          </div>

          {tasks.length > 0 && (
            <section>
              <SectionLabel>
                <Translate>Tasks</Translate> · {tasks.length}
              </SectionLabel>
              <ul className="space-y-2 px-3 pb-3">
                {tasks.map(task => (
                  <li key={task.id}>
                    <TaskItem task={task} onRemove={removeTask} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!hasVisibleNotifications && <EmptyState filter={filter} />}

          {bucketOrder.map(bucket =>
            groupedNotifications[bucket].length === 0 ? null : (
              <section key={bucket}>
                <SectionLabel>
                  {bucket === 'new' && <Translate>New</Translate>}
                  {bucket === 'today' && <Translate>Today</Translate>}
                  {bucket === 'earlier' && <Translate>Earlier</Translate>}
                </SectionLabel>
                <ul className="space-y-2 px-3 pb-3">
                  {groupedNotifications[bucket].map(notification => (
                    <li key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        isUnread={unreadIds.has(notification.id)}
                        onDismiss={removeNotification}
                        onRead={markNotificationRead}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
        </Sidepanel.Body>
        <Sidepanel.Footer className="border-t border-t-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] p-3">
          <Button
            variant="secondary"
            onClick={clearAll}
            className="w-full"
            disabled={!hasClearable}
          >
            <Translate>Clear all</Translate>
          </Button>
        </Sidepanel.Footer>
      </Sidepanel>
    </div>
  );
};

export { NotificationsPanel };
