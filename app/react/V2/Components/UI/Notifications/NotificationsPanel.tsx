import React, { useMemo } from 'react';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { Button } from '#V2/Components/UI/Button.js';
import { type StatusNotification, useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';
import { EmptyState } from './EmptyState.js';
import { SectionLabel } from './SectionLabel.js';
import { Translate } from '#app/I18N/index.js';

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

  const hasClearable = notifications.length > 0 || tasks.some(t => t.status !== 'running');
  const groupedNotifications = useMemo(() => {
    const groups: Record<Bucket, StatusNotification[]> = { today: [], earlier: [] };
    const todayStart = getTodayStart();
    notifications.forEach(notification => {
      groups[getBucket(notification, todayStart)].push(notification);
    });
    groups.today.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    groups.earlier.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return groups;
  }, [notifications]);
  const orderedNotifications = useMemo(
    () => bucketOrder.flatMap(bucket => groupedNotifications[bucket]),
    [groupedNotifications]
  );
  const hasVisibleNotifications = orderedNotifications.length > 0;

  const title = (
    <span className="flex items-center gap-2">
      <Translate className="capitalize">Notifications</Translate>
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

          {!hasVisibleNotifications && tasks.length === 0 && <EmptyState />}

          {bucketOrder.map(bucket =>
            groupedNotifications[bucket].length === 0 ? null : (
              <section key={bucket}>
                <SectionLabel>
                  {bucket === 'today' && <Translate>Today</Translate>}
                  {bucket === 'earlier' && <Translate>Earlier</Translate>}
                </SectionLabel>
                <ul className="space-y-2 px-3 pb-3">
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
