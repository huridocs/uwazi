import React, { useState } from 'react';
import { LinkSlashIcon } from '@heroicons/react/24/outline';
import type {
  NotificationType,
  OverallStatus,
  StatusNotification,
  StatusTask,
} from '#V2/atoms/requestStatusAtom.js';
import { UwaziLoader, type UwaziLoaderColor } from '#V2/Components/UI/UwaziLoader.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { Translate } from '#app/I18N/index.js';
import { NotificationKindIcon } from './notificationKindIcons.js';

interface FlashState {
  id: string;
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
}

interface BeaconProps {
  overallStatus: OverallStatus;
  isConnected: boolean;
  hasRunningTasks: boolean;
  isLoading: boolean;
  isPanelOpen: boolean;
  tasks: StatusTask[];
  notifications: StatusNotification[];
  flash: FlashState | null;
  popKey?: number;
  onClick: () => void;
  controlsId: string;
}

const COLLAPSED_WIDTH = '1.75rem';
const EXPANDED_WIDTH = '15rem';
const FLASH_WIDTH = '17rem';

const PILL_BG_WARM = 'var(--color-theme-surface-warm, var(--color-theme-bg-warm, #f9fafb))';
const PILL_BG_VELLUM = 'var(--color-theme-surface-muted, var(--color-theme-bg-muted, #f3f4f6))';

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

const BeaconRailLabel = ({ text, suffix }: { text: string; suffix?: React.ReactNode }) => (
  <div className="flex min-w-0 flex-1 items-center gap-2">
    <span title={text} className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
      {text}
    </span>
    {suffix}
  </div>
);

const DisconnectWarning = ({ tooltipId }: { tooltipId: string }) => (
  <span className="relative inline-flex group">
    <button
      type="button"
      className="inline-flex items-center rounded-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-indigo-300"
      aria-label="Server disconnected"
      aria-describedby={tooltipId}
    >
      <LinkSlashIcon className="h-4 w-4 cursor-help" aria-hidden="true" />
    </button>
    <span
      id={tooltipId}
      role="tooltip"
      className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md border border-border bg-paper px-2.5 py-1.5 text-xs text-ink-secondary whitespace-nowrap opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <Translate>Cannot connect to server</Translate>
    </span>
  </span>
);

const Beacon = ({
  overallStatus,
  isConnected,
  hasRunningTasks,
  isLoading,
  isPanelOpen,
  tasks,
  notifications,
  flash,
  popKey,
  onClick,
  controlsId,
}: BeaconProps) => {
  const isMobile = useIsMobile();
  const canExpand = isMobile !== true;
  const [hovered, setHovered] = useState(false);

  const runningTasks = tasks.filter(t => t.status === 'running');
  const hasActivity = runningTasks.length > 0;
  const showFlash = Boolean(flash && flash.phase === 'showing');
  const hasContent = showFlash || hasActivity || notifications.length > 0;
  const isExpanded = canExpand && !isPanelOpen && hasContent && (showFlash || hovered);

  const showVeil = isExpanded || showFlash;
  const widthCap = canExpand && showFlash ? FLASH_WIDTH : EXPANDED_WIDTH;
  const pillBg = isPanelOpen ? PILL_BG_VELLUM : PILL_BG_WARM;
  const pillSurface = isPanelOpen ? 'bg-vellum' : 'bg-warm';
  const boxStyle: React.CSSProperties = {
    width: 'max-content',
    minWidth: COLLAPSED_WIDTH,
    maxWidth: showVeil ? widthCap : COLLAPSED_WIDTH,
    transitionProperty: 'max-width, box-shadow',
    transitionDuration: '0.42s',
    ['--beacon-pill-bg' as string]: pillBg,
  };

  const isBusy = isLoading || overallStatus === 'loading' || hasRunningTasks;
  const markColor = isBusy ? 'carbon' : statusColor[overallStatus];

  const activityLabel =
    runningTasks.length === 1 ? runningTasks[0].label : `${runningTasks.length} tasks running`;
  const taskProgress = averageProgress(runningTasks);

  const latest = notifications[notifications.length - 1];
  const moreCount = notifications.length - 1;

  const suffixClass = 'shrink-0 text-[11px] font-semibold text-ink-tertiary tabular-nums';
  const buttonSurface = showFlash
    ? isPanelOpen
      ? 'bg-vellum hover:bg-vellum'
      : 'bg-warm hover:bg-warm'
    : isPanelOpen
      ? 'bg-vellum hover:bg-parchment'
      : 'bg-warm hover:bg-parchment';

  return (
    <div dir="ltr" className="relative flex shrink-0 items-center gap-1.5">
      {!isConnected && <DisconnectWarning tooltipId="disconnect-tooltip" />}

      <div className="relative h-7 w-7 shrink-0">
        <div
          className="absolute end-0 top-1/2 z-50 -translate-y-1/2"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {showVeil && (
            <div
              aria-hidden
              className="beacon-collision-veil pointer-events-none absolute end-full top-1/2 h-[3.25rem] w-[5.5rem] -translate-y-1/2"
            />
          )}
          <div
            className={`relative rounded-md beacon-spring ${
              showVeil ? '' : pillSurface
            } ${popKey ? 'animate-beacon-pop' : ''}`}
            style={boxStyle}
          >
            {showVeil && (
              <div
                aria-hidden
                className="beacon-chrome-backing pointer-events-none absolute end-0 top-1/2 z-0 w-full -translate-y-1/2"
              />
            )}
            <div className="relative z-10 overflow-hidden rounded-[inherit]">
              <button
                type="button"
                data-testid="status-dot"
                onClick={onClick}
                aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
                aria-controls={controlsId}
                aria-expanded={isPanelOpen}
                className={`relative z-10 flex h-7 w-full items-center px-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${buttonSurface}`}
              >
                {showFlash && flash ? (
                  <div
                    key="flash"
                    data-testid="notification-flash"
                    className="animate-beacon-rail flex w-full min-w-0 items-center gap-2"
                  >
                    <NotificationKindIcon type={flash.type} size="beacon" />
                    <span
                      data-testid="notification-flash-title"
                      title={flash.title}
                      className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink"
                    >
                      {flash.title}
                    </span>
                  </div>
                ) : isExpanded && hasActivity ? (
                  <div
                    key="live"
                    className="animate-beacon-rail flex w-full min-w-0 items-center gap-2"
                  >
                    <span className="flex shrink-0 items-center">
                      <UwaziLoader size="xs" color="carbon" animate />
                    </span>
                    <BeaconRailLabel
                      text={activityLabel}
                      suffix={
                        taskProgress !== null ? (
                          <span className={suffixClass}>{taskProgress}%</span>
                        ) : undefined
                      }
                    />
                  </div>
                ) : isExpanded && latest ? (
                  <div
                    key="summary"
                    className="animate-beacon-rail flex w-full min-w-0 items-center gap-2"
                  >
                    <NotificationKindIcon type={latest.type} size="beacon" />
                    <BeaconRailLabel
                      text={latest.title}
                      suffix={
                        moreCount > 0 ? (
                          <span className={suffixClass}>+{moreCount}</span>
                        ) : undefined
                      }
                    />
                  </div>
                ) : (
                  <div key="idle" className="flex w-full items-center justify-center">
                    <UwaziLoader size="xs" color={markColor} animate={isBusy} />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { BeaconProps, FlashState };
export { Beacon };
