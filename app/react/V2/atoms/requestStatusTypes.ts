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

interface RequestStatusState {
  notifications: StatusNotification[];
  unreadNotificationIds: string[];
  tasks: StatusTask[];
  isConnected: boolean;
  isPanelOpen: boolean;
  isLoading: boolean;
}

export type {
  NotificationType,
  TaskStatus,
  OverallStatus,
  StatusNotification,
  StatusTask,
  TaskListenerUpdate,
  TaskUpdate,
  NotifyArgs,
  TaskListenerSetup,
  RequestStatusState,
};
