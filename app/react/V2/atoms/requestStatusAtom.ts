import { atom, useAtom } from 'jotai';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

type TaskStatus = 'running' | 'completed' | 'failed';

type OverallStatus = 'loading' | 'error' | 'warning' | 'success';

interface StatusNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  details?: string;
  timestamp: Date;
}

interface StatusTask {
  id: string;
  label: string;
  progress?: number;
  status: TaskStatus;
}

interface RequestStatusState {
  notifications: StatusNotification[];
  unreadNotificationIds: string[];
  tasks: StatusTask[];
  isConnected: boolean;
  isPanelOpen: boolean;
  isLoading: boolean;
}

const initialState: RequestStatusState = {
  notifications: [],
  unreadNotificationIds: [],
  tasks: [],
  isConnected: true,
  isPanelOpen: false,
  isLoading: false,
};

const requestStatusAtom = atom<RequestStatusState>(initialState);

const useRequestStatus = () => {
  const [state, setState] = useAtom(requestStatusAtom);

  const hasRunningTasks = state.tasks.some(t => t.status === 'running');

  const unreadNotifications = state.notifications.filter(n =>
    state.unreadNotificationIds.includes(n.id)
  );

  const overallStatus: OverallStatus = (() => {
    if (state.isLoading) return 'loading';
    if (unreadNotifications.some(n => n.type === 'error')) return 'error';
    if (unreadNotifications.some(n => n.type === 'warning')) return 'warning';
    return 'success';
  })();

  const notify = (
    type: NotificationType,
    title: string,
    message?: string,
    details?: string,
    timestamp?: Date
  ) => {
    const id = crypto.randomUUID();
    setState(prev => ({
      ...prev,
      notifications: [
        ...prev.notifications,
        { id, type, title, message, details, timestamp: timestamp ?? new Date() },
      ],
      unreadNotificationIds: [...prev.unreadNotificationIds, id],
    }));
  };

  const registerTask = (id: string, label: string, initialProgress?: number) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id, label, progress: initialProgress, status: 'running' }],
    }));
  };

  const updateTask = (
    id: string,
    updates: Partial<Pick<StatusTask, 'label' | 'progress' | 'status'>>
  ) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => (task.id === id ? { ...task, ...updates } : task)),
    }));
  };

  const endTask = (id: string, finalStatus: 'completed' | 'failed' = 'completed') => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id
          ? { ...task, status: finalStatus, progress: finalStatus === 'completed' ? 100 : task.progress }
          : task
      ),
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [], unreadNotificationIds: [] }));
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadNotificationIds: [],
      tasks: prev.tasks.filter(t => t.status === 'running'),
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      unreadNotificationIds: prev.unreadNotificationIds.filter(uid => uid !== id),
    }));
  };

  const setConnected = (connected: boolean) => {
    setState(prev => ({ ...prev, isConnected: connected }));
  };

  const togglePanel = () => {
    setState(prev => ({
      ...prev,
      isPanelOpen: !prev.isPanelOpen,
      // Mark all notifications read when opening the panel
      unreadNotificationIds: prev.isPanelOpen ? prev.unreadNotificationIds : [],
    }));
  };

  const startLoading = () => {
    setState(prev => ({ ...prev, isLoading: true }));
  };

  const endLoading = () => {
    setState(prev => ({ ...prev, isLoading: false }));
  };

  return {
    ...state,
    overallStatus,
    hasRunningTasks,
    notificationCount: state.notifications.length,
    notify,
    registerTask,
    updateTask,
    endTask,
    clearNotifications,
    clearAll,
    removeNotification,
    setConnected,
    togglePanel,
    startLoading,
    endLoading,
  };
};

export type { NotificationType, TaskStatus, OverallStatus, StatusNotification, StatusTask, RequestStatusState };
export { requestStatusAtom, useRequestStatus };
