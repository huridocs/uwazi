import React from 'react';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { Button } from '#V2/Components/UI/Button.js';
import { StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';
import { NotificationItem } from './NotificationItem.js';
import { TaskItem } from './TaskItem.js';
import { Translate } from '#app/I18N/index.js';

interface NotificationsPanelProps {
  isOpen: boolean;
  notifications: StatusNotification[];
  tasks: StatusTask[];
  onClose: () => void;
  onDismissNotification: (id: string) => void;
  onRemoveTask: (id: string) => void;
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
  onRemoveTask,
  onClear,
}: NotificationsPanelProps) => {
  const isEmpty = notifications.length === 0 && tasks.length === 0;
  const hasClearable = notifications.length > 0 || tasks.some(t => t.status !== 'running');

  return (
    <div data-testid="notifications-panel" className="whitespace-normal">
      <Sidepanel
        isOpen={isOpen}
        closeSidepanelFunction={onClose}
        title={<Translate className="capitalize">Notifications</Translate>}
        size="medium"
        withOverlay
      >
        <Sidepanel.Body className="flex flex-col gap-4 overflow-y-auto">
          {isEmpty && <EmptyState />}

          {tasks.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tasks
              </h2>
              <ul className="flex flex-col gap-2" role="list">
                {tasks.map(task => (
                  <li key={task.id}>
                    <TaskItem task={task} onRemove={onRemoveTask} />
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
                {[...notifications].reverse().map(notification => (
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
        {hasClearable && (
          <Sidepanel.Footer className="p-4 border-t border-gray-100">
            <Button styling="light" color="primary" onClick={onClear} className="w-full">
              <span className="flex items-center justify-center gap-1.5">
                <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <Translate>Empty</Translate>
              </span>
            </Button>
          </Sidepanel.Footer>
        )}
      </Sidepanel>
    </div>
  );
};

export type { NotificationsPanelProps };
export { NotificationsPanel };
