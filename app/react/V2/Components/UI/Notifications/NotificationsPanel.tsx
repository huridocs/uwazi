import React from 'react';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';

interface NotificationsPanelProps {
  isOpen: boolean;
  notifications: StatusNotification[];
  tasks: StatusTask[];
  onClose: () => void;
  onDismissNotification: (id: string) => void;
  onClear: () => void;
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
    <span className="block w-3 h-3 rounded-full bg-green-400 mb-3" />
    <p className="text-sm font-medium">All clear</p>
    <p className="text-xs mt-1">No notifications or active tasks.</p>
  </div>
);

const NotificationsPanel = ({
  isOpen,
  notifications,
  tasks,
  onClose,
  onDismissNotification,
  onClear,
}: NotificationsPanelProps) => {
  const isEmpty = notifications.length === 0 && tasks.length === 0;
  const hasClearable =
    notifications.length > 0 || tasks.some(t => t.status !== 'running');

  const clearButton = hasClearable ? (
    <button
      type="button"
      onClick={onClear}
      aria-label="Clear notifications and completed tasks"
      className="flex w-full items-center justify-center gap-1 px-2 py-1 text-xs text-gray-500 rounded cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
    >
      <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
      Clear
    </button>
  ) : undefined;

  return (
    <Sidepanel
      isOpen={isOpen}
      closeSidepanelFunction={onClose}
      title={clearButton}
      size="small"
      withOverlay
    >
      <Sidepanel.Body className="flex flex-col gap-4">

        {isEmpty && <EmptyState />}

        {tasks.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tasks
            </h2>
            <ul className="flex flex-col gap-2" role="list">
              {tasks.map(task => (
                <li key={task.id}>
                  <TaskItem task={task} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {notifications.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Notifications
            </h2>
            <ul className="flex flex-col gap-2" role="list">
              {notifications.map(notification => (
                <li key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onDismiss={onDismissNotification}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Sidepanel.Body>
    </Sidepanel>
  );
};

export type { NotificationsPanelProps };
export { NotificationsPanel };
