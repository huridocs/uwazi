import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HandThumbUpIcon } from '@heroicons/react/24/outline';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { Button } from '#V2/Components/UI/Button.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';
import { Translate } from '#app/I18N/index.js';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-1 text-center text-(--color-theme-text-muted)">
    <HandThumbUpIcon className="h-6 w-6" />
    <p className="font-semibold text-lg">
      <Translate>All clear</Translate>
    </p>
    <p className="mt-1">
      <Translate>No notifications or active tasks.</Translate>
    </p>
  </div>
);

const NotificationsPanel = () => {
  const {
    isPanelOpen,
    notifications,
    tasks,
    togglePanel,
    removeNotification,
    removeTask,
    clearAll,
  } = useRequestStatus();

  const isEmpty = notifications.length === 0 && tasks.length === 0;
  const hasClearable = notifications.length > 0 || tasks.some(t => t.status !== 'running');
  const orderedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [notifications]
  );
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
  const notificationRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (orderedNotifications.length === 0) {
      setActiveNotificationIndex(0);
      return;
    }

    setActiveNotificationIndex(current => Math.min(current, orderedNotifications.length - 1));
  }, [orderedNotifications.length]);

  useEffect(() => {
    if (!isPanelOpen || orderedNotifications.length === 0) return;

    const frameId = requestAnimationFrame(() => {
      notificationRefs.current[activeNotificationIndex]?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [activeNotificationIndex, isPanelOpen, orderedNotifications.length]);

  const focusNotification = (direction: 'next' | 'prev', currentIndex: number) => {
    if (orderedNotifications.length === 0) return;

    const lastIndex = orderedNotifications.length - 1;
    let nextIndex = currentIndex;

    if (direction === 'next') {
      nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
    }

    setActiveNotificationIndex(nextIndex);
  };

  return (
    <div data-testid="notifications-panel" className="tw-content">
      <Sidepanel
        isOpen={isPanelOpen}
        closeSidepanelFunction={togglePanel}
        title={<Translate className="capitalize">Notifications</Translate>}
        size="medium"
        withOverlay
        panelId="notifications-panel-dialog"
      >
        <Sidepanel.Body className="flex flex-col gap-4 overflow-y-auto">
          {isEmpty && <EmptyState />}

          {tasks.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-theme-text-tertiary)">
                <Translate>Tasks</Translate>
              </h2>
              <ul className="flex flex-col gap-2">
                {tasks.map(task => (
                  <li key={task.id}>
                    <TaskItem task={task} onRemove={removeTask} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {notifications.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-theme-text-tertiary)">
                <Translate>Notifications</Translate>
              </h2>
              <ul className="flex flex-col gap-2">
                {orderedNotifications.map((notification, index) => (
                  <li key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onDismiss={removeNotification}
                      tabIndex={index === activeNotificationIndex ? 0 : -1}
                      itemRef={element => {
                        notificationRefs.current[index] = element;
                      }}
                      onArrowNavigate={direction => focusNotification(direction, index)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Sidepanel.Body>
        {hasClearable && (
          <Sidepanel.Footer className="border-t p-4 border-t-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)]">
            <Button variant="secondary" onClick={clearAll} className="w-full">
              <span className="flex items-center justify-center gap-1.5">
                <Translate>Clear</Translate>
              </span>
            </Button>
          </Sidepanel.Footer>
        )}
      </Sidepanel>
    </div>
  );
};

export { NotificationsPanel };
