import { atom, useAtom } from 'jotai';
import { getStore } from '#shared/atomStore/index.js';

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

type TaskListenerSetup = (
  update: (updates: Partial<Pick<StatusTask, 'label' | 'progress'>>) => void,
  complete: () => void,
  fail: (details?: string) => void
) => () => void;

/** Stores cleanup functions (socket unsubscribes) keyed by task ID, outside the atom. */
const taskCleanups = new Map<string, () => void>();

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

/** Minimum time the loading animation stays visible, even if the request finishes sooner. */
const MIN_LOADING_MS = 1000;

let _loadingStartedAt: number | null = null;
let _loadingEndTimer: ReturnType<typeof setTimeout> | null = null;

const startLoading = () => {
  _loadingStartedAt = Date.now();
  if (_loadingEndTimer !== null) {
    clearTimeout(_loadingEndTimer);
    _loadingEndTimer = null;
  }
  getStore().set(requestStatusAtom, prev => ({ ...prev, isLoading: true }));
};

const endLoading = () => {
  const elapsed = _loadingStartedAt !== null ? Date.now() - _loadingStartedAt : MIN_LOADING_MS;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  if (remaining > 0) {
    if (_loadingEndTimer !== null) clearTimeout(_loadingEndTimer);
    _loadingEndTimer = setTimeout(() => {
      getStore().set(requestStatusAtom, prev => ({ ...prev, isLoading: false }));
      _loadingStartedAt = null;
      _loadingEndTimer = null;
    }, remaining);
  } else {
    getStore().set(requestStatusAtom, prev => ({ ...prev, isLoading: false }));
    _loadingStartedAt = null;
  }
};

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

  const registerTask = (
    id: string,
    label: string,
    setupListeners?: TaskListenerSetup,
    initialProgress?: number
  ) => {
    // filter out any existing task with the same id (re-registration / re-run)
    setState(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks.filter(t => t.id !== id),
        { id, label, progress: initialProgress, status: 'running' },
      ],
    }));

    if (setupListeners) {
      const existingCleanup = taskCleanups.get(id);
      if (existingCleanup) {
        existingCleanup();
        taskCleanups.delete(id);
      }
      const cleanup = setupListeners(
        updates => updateTask(id, updates),
        () => endTask(id, 'completed'),
        () => endTask(id, 'failed')
      );
      taskCleanups.set(id, cleanup);
    }
  };

  const removeTask = (id: string) => {
    const cleanup = taskCleanups.get(id);
    if (cleanup) {
      cleanup();
      taskCleanups.delete(id);
    }
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
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

  // Hook-local versions of startLoading/endLoading that use setState (works in any Jotai store
  // context, including Storybook's default store). The module-level versions use getStore() for
  // imperative callers outside React (notifyBridge, LoadingProgressBar).
  const startLoadingHook = () => {
    _loadingStartedAt = Date.now();
    if (_loadingEndTimer !== null) {
      clearTimeout(_loadingEndTimer);
      _loadingEndTimer = null;
    }
    setState(prev => ({ ...prev, isLoading: true }));
  };

  const endLoadingHook = () => {
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

  return {
    ...state,
    overallStatus,
    hasRunningTasks,
    notificationCount: state.notifications.length,
    notify,
    registerTask,
    updateTask,
    endTask,
    removeTask,
    clearNotifications,
    clearAll,
    removeNotification,
    setConnected,
    togglePanel,
    startLoading: startLoadingHook,
    endLoading: endLoadingHook,
  };
};

export type { NotificationType, TaskStatus, OverallStatus, StatusNotification, StatusTask, RequestStatusState, TaskListenerSetup };
export { requestStatusAtom, useRequestStatus, startLoading, endLoading, MIN_LOADING_MS };
