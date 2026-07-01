import type {
  NotificationType,
  OverallStatus,
  StatusNotification,
  StatusTask,
} from '#V2/atoms/requestStatusAtom.js';
import type { UwaziLoaderColor } from '#V2/Components/UI/UwaziLoader.js';

interface FlashState {
  id: string;
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
}

const statusColor: Record<OverallStatus, UwaziLoaderColor> = {
  loading: 'carbon',
  error: 'seal',
  warning: 'warning',
  success: 'default',
};

const buildAriaLabel = (
  overallStatus: OverallStatus,
  isConnected: boolean,
  hasRunningTasks: boolean
): string => {
  const parts = [`Status: ${overallStatus}`];
  if (!isConnected) parts.push('server disconnected');
  if (hasRunningTasks) parts.push('tasks running');
  return `Notifications — ${parts.join(', ')}`;
};

const averageProgress = (runningTasks: StatusTask[]): number | null => {
  const defined = runningTasks.filter(t => t.progress !== undefined);
  if (defined.length === 0) return null;
  return Math.round(defined.reduce((sum, t) => sum + (t.progress ?? 0), 0) / defined.length);
};

const getButtonSurface = (showFlash: boolean, isPanelOpen: boolean): string => {
  if (showFlash) return isPanelOpen ? 'bg-vellum hover:bg-vellum' : 'bg-warm hover:bg-warm';
  return isPanelOpen ? 'bg-vellum hover:bg-parchment' : 'bg-warm hover:bg-parchment';
};

const deriveBeaconDisplay = (
  tasks: StatusTask[],
  notifications: StatusNotification[],
  flash: FlashState | null,
  options: {
    canExpand: boolean;
    isPanelOpen: boolean;
    hovered: boolean;
    isLoading: boolean;
    overallStatus: OverallStatus;
    hasRunningTasks: boolean;
  }
) => {
  const runningTasks = tasks.filter(t => t.status === 'running');
  const hasActivity = runningTasks.length > 0;
  const showFlash = Boolean(flash && flash.phase === 'showing');
  const hasContent = showFlash || hasActivity || notifications.length > 0;
  const isExpanded =
    options.canExpand &&
    !options.isPanelOpen &&
    hasContent &&
    (showFlash || options.hovered || hasActivity);
  const isBusy =
    options.isLoading || options.overallStatus === 'loading' || options.hasRunningTasks;

  return {
    runningTasks,
    hasActivity,
    showFlash,
    isExpanded,
    isBusy,
    markColor: hasActivity ? 'carbon' : statusColor[options.overallStatus],
    activityLabel:
      runningTasks.length === 1 ? runningTasks[0].label : `${runningTasks.length} tasks running`,
    taskProgress: averageProgress(runningTasks),
    latest: notifications[notifications.length - 1],
    moreCount: notifications.length - 1,
    buttonSurface: getButtonSurface(showFlash, options.isPanelOpen),
  };
};

export { buildAriaLabel, deriveBeaconDisplay };
export type { FlashState };
