import { useMemo } from 'react';
import { atom, useAtom } from 'jotai';
import { getStore } from '#shared/atomStore/index.js';
import { createUuid } from '#V2/utils/uuid.js';

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

type TaskListenerUpdate = { label?: string; progress?: number };
type TaskUpdate = TaskListenerUpdate & { status?: TaskStatus };
type NotifyArgs = [NotificationType, string, string?, string?, Date?];

type TaskListenerSetup = (
  update: (updates: TaskListenerUpdate) => void,
  complete: () => void,
  fail: (details?: string) => void
) => () => void;

const taskCleanups: Map<string, () => void> = new Map();

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

const MIN_LOADING_MS = 1000;
type SetRequestStatusState = (update: (prev: RequestStatusState) => RequestStatusState) => void;

let _loadingStartedAt: number | null = null;
let _loadingEndTimer: ReturnType<typeof setTimeout> | null = null;

const startLoadingWith = (setState: SetRequestStatusState) => {
  _loadingStartedAt = Date.now();
  if (_loadingEndTimer !== null) {
    clearTimeout(_loadingEndTimer);
    _loadingEndTimer = null;
  }
  setState(prev => ({ ...prev, isLoading: true }));
};

const endLoadingWith = (setState: SetRequestStatusState) => {
  const elapsed = _loadingStartedAt !== null ? Date.now() - _loadingStartedAt : MIN_LOADING_MS;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  if (remaining > 0) {
    if (_loadingEndTimer !== null) clearTimeout(_loadingEndTimer);
    _loadingEndTimer = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
      _loadingStartedAt = null;
      _loadingEndTimer = null;
    }, remaining);
  } else {
    setState(prev => ({ ...prev, isLoading: false }));
    _loadingStartedAt = null;
  }
};

const startLoading = () => startLoadingWith(update => getStore().set(requestStatusAtom, update));

const endLoading = () => endLoadingWith(update => getStore().set(requestStatusAtom, update));

const getOverallStatus = (state: RequestStatusState): OverallStatus => {
  const unreadNotifications = state.notifications.filter(n =>
    state.unreadNotificationIds.includes(n.id)
  );
  if (state.isLoading) return 'loading';
  if (unreadNotifications.some(n => n.type === 'error')) return 'error';
  if (unreadNotifications.some(n => n.type === 'warning')) return 'warning';
  return 'success';
};

const updateTaskState = (setState: SetRequestStatusState, id: string, updates: TaskUpdate) => {
  setState(prev => ({
    ...prev,
    tasks: prev.tasks.map(task => (task.id === id ? { ...task, ...updates } : task)),
  }));
};

const endTaskState = (
  setState: SetRequestStatusState,
  id: string,
  finalStatus: 'completed' | 'failed' = 'completed'
) => {
  setState(prev => ({
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

const replaceTask = (
  setState: SetRequestStatusState,
  id: string,
  label: string,
  initialProgress?: number
) => {
  setState(prev => ({
    ...prev,
    tasks: [
      ...prev.tasks.filter(t => t.id !== id),
      { id, label, progress: initialProgress, status: 'running' },
    ],
  }));
};

const clearTaskCleanup = (id: string) => {
  const cleanup = taskCleanups.get(id);
  if (cleanup) {
    cleanup();
    taskCleanups.delete(id);
  }
};

const registerTaskListeners = (
  setState: SetRequestStatusState,
  id: string,
  setupListeners?: TaskListenerSetup
) => {
  if (!setupListeners) return;
  clearTaskCleanup(id);
  taskCleanups.set(
    id,
    setupListeners(
      updates => updateTaskState(setState, id, updates),
      () => endTaskState(setState, id, 'completed'),
      () => endTaskState(setState, id, 'failed')
    )
  );
};

const getRequestStatusActions = (setState: SetRequestStatusState) => ({
  notify: (...[type, title, message, details, timestamp]: NotifyArgs) => {
    const id = createUuid();
    setState(prev => ({
      ...prev,
      notifications: [
        ...prev.notifications,
        { id, type, title, message, details, timestamp: timestamp ?? new Date() },
      ],
      unreadNotificationIds: [...prev.unreadNotificationIds, id],
    }));
  },
  registerTask: (
    id: string,
    label: string,
    setupListeners?: TaskListenerSetup,
    initialProgress?: number
  ) => {
    replaceTask(setState, id, label, initialProgress);
    registerTaskListeners(setState, id, setupListeners);
  },
  updateTask: (id: string, updates: TaskUpdate) => updateTaskState(setState, id, updates),
  endTask: (id: string, finalStatus: 'completed' | 'failed' = 'completed') =>
    endTaskState(setState, id, finalStatus),
  removeTask: (id: string) => {
    clearTaskCleanup(id);
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  },
  clearNotifications: () =>
    setState(prev => ({ ...prev, notifications: [], unreadNotificationIds: [] })),
  clearAll: () =>
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadNotificationIds: [],
      tasks: prev.tasks.filter(t => t.status === 'running'),
    })),
  removeNotification: (id: string) =>
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      unreadNotificationIds: prev.unreadNotificationIds.filter(uid => uid !== id),
    })),
  markNotificationRead: (id: string) =>
    setState(prev => ({
      ...prev,
      unreadNotificationIds: prev.unreadNotificationIds.filter(uid => uid !== id),
    })),
  markAllNotificationsRead: () => setState(prev => ({ ...prev, unreadNotificationIds: [] })),
  setConnected: (connected: boolean) => setState(prev => ({ ...prev, isConnected: connected })),
  openPanel: () => setState(prev => ({ ...prev, isPanelOpen: true })),
  closePanel: () => setState(prev => ({ ...prev, isPanelOpen: false })),
  togglePanel: () => setState(prev => ({ ...prev, isPanelOpen: !prev.isPanelOpen })),
  startLoading: () => startLoadingWith(setState),
  endLoading: () => endLoadingWith(setState),
});

const useRequestStatus = () => {
  const [state, setState] = useAtom(requestStatusAtom);
  const actions = useMemo(() => getRequestStatusActions(setState), [setState]);

  return {
    ...state,
    overallStatus: getOverallStatus(state),
    hasRunningTasks: state.tasks.some(t => t.status === 'running'),
    notificationCount: state.notifications.length,
    unreadNotificationCount: state.unreadNotificationIds.length,
    ...actions,
  };
};
export type {
  NotificationType,
  TaskStatus,
  OverallStatus,
  StatusNotification,
  StatusTask,
  RequestStatusState,
  TaskListenerSetup,
};
export { requestStatusAtom, useRequestStatus, startLoading, endLoading, MIN_LOADING_MS };
