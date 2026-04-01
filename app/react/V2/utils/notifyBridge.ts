import { getStore } from '#shared/atomStore/index.js';
import { requestStatusAtom, startLoading, endLoading } from '#V2/atoms/requestStatusAtom.js';

type BridgeNotificationType = 'success' | 'warning' | 'danger' | 'error' | 'info';

// Maps old-style 'danger' type to new 'error' type
const mapType = (type: BridgeNotificationType): 'success' | 'warning' | 'error' | 'info' =>
  type === 'danger' ? 'error' : type;

const notify = (
  title: string,
  type: BridgeNotificationType,
  message?: string,
  details?: string
) => {
  const id = crypto.randomUUID();
  getStore().set(requestStatusAtom, prev => ({
    ...prev,
    notifications: [
      ...prev.notifications,
      { id, type: mapType(type), title, message, details, timestamp: new Date() },
    ],
    unreadNotificationIds: [...prev.unreadNotificationIds, id],
  }));
};

const setConnected = (connected: boolean) => {
  getStore().set(requestStatusAtom, prev => ({ ...prev, isConnected: connected }));
};

const registerTask = (id: string, label: string) => {
  getStore().set(requestStatusAtom, prev => ({
    ...prev,
    tasks: [...prev.tasks, { id, label, status: 'running' }],
  }));
};

const endTask = (id: string, finalStatus: 'completed' | 'failed' = 'completed') => {
  getStore().set(requestStatusAtom, prev => ({
    ...prev,
    tasks: prev.tasks.map(task =>
      task.id === id
        ? {
            ...task,
            status: finalStatus,
            progress: finalStatus === 'completed' ? 100 : task.progress,
          }
        : task
    ),
  }));
};

export { notify, startLoading, endLoading, setConnected, registerTask, endTask };
