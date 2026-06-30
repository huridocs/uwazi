import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import type { NotificationType } from '#V2/atoms/requestStatusAtom.js';
import { useContrastColor } from '#V2/CustomHooks/useContrastColor.js';
import { useResolvedBackgroundColor } from '#V2/CustomHooks/useResolvedBackgroundColor.js';
import { CsvImportTasksSubscriber } from '#V2/Routes/Settings/CSVUpload/CsvImportTasksSubscriber.js';
import { StatusDot } from './StatusDot.js';
import { NotificationFlash } from './NotificationFlash.js';

interface FlashState {
  id: string;
  title: string;
  type: NotificationType;
  phase: 'showing' | 'leaving';
}

interface E2ERequestStatusState {
  isLoading: boolean;
  hasRunningTasks: boolean;
  isIdle: boolean;
  overallStatus: string;
  updatedAt: number;
}

const flashTypeLabel: Record<NotificationType, string> = {
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  info: 'Information',
};

const railIcon: Record<NotificationType, { Icon: typeof CheckCircleIcon; color: string }> = {
  success: { Icon: CheckCircleIcon, color: 'text-success' },
  error: { Icon: XCircleIcon, color: 'text-emphasis' },
  warning: { Icon: ExclamationTriangleIcon, color: 'text-(--color-theme-warning)' },
  info: { Icon: InformationCircleIcon, color: 'text-supporting' },
};

const RequestStatus = () => {
  const {
    overallStatus,
    isConnected,
    hasRunningTasks,
    isPanelOpen,
    notifications,
    togglePanel,
    openPanel,
    isLoading,
  } = useRequestStatus();

  const containerRef = useRef<HTMLDivElement>(null);
  const contrastColor = useContrastColor(containerRef);
  const barBackground = useResolvedBackgroundColor(containerRef);

  const [flash, setFlash] = useState<FlashState | null>(null);
  const lastFlashId = useRef<string | null>(null);
  // Timers are stored in refs so they are only cleared when a new flash starts,
  // not on every notifications change (which was causing the flash to get stuck).
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [popKey, setPopKey] = useState(0);
  const lastPopId = useRef<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const PANEL_ID = 'notifications-panel-dialog';
  const liveAnnouncement = flash ? `${flashTypeLabel[flash.type]}: ${flash.title}` : '';

  const startFlash = useCallback((id: string, title: string, type: NotificationType) => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    setFlash({ id, title, type, phase: 'showing' });

    // 3400ms = ~350ms enter animation + 3000ms hold
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      setFlash(f => (f ? { ...f, phase: 'leaving' } : null));
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null;
        setFlash(null);
      }, 350);
    }, 3400);
  }, []);

  // Clean up timers on unmount
  useEffect(
    () => () => {
      if (leaveTimerRef.current !== null) clearTimeout(leaveTimerRef.current);
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const latest = notifications[notifications.length - 1];
    if (!latest || latest.id === lastFlashId.current) return;
    lastFlashId.current = latest.id;
    startFlash(latest.id, latest.title, latest.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  useEffect(() => {
    const latest = notifications[notifications.length - 1];
    if (!latest || (latest.type !== 'success' && latest.type !== 'info')) return;
    if (latest.id === lastPopId.current) return;
    lastPopId.current = latest.id;
    setPopKey(k => k + 1);
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    (
      window as typeof window & { __uwaziRequestStatus?: E2ERequestStatusState }
    ).__uwaziRequestStatus = {
      isLoading,
      hasRunningTasks,
      isIdle: !isLoading && !hasRunningTasks,
      overallStatus,
      updatedAt: Date.now(),
    };
  }, [hasRunningTasks, isLoading, overallStatus]);

  const latest = notifications[notifications.length - 1];
  const moreCount = notifications.length - 1;
  const showRail = hovered && !flash && !isPanelOpen && Boolean(latest);
  const RailIcon = latest ? railIcon[latest.type].Icon : null;

  return (
    <>
      <CsvImportTasksSubscriber />
      <div
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative inline-flex min-h-13 items-center gap-1.5 rounded-xl p-1"
      >
        {showRail && latest && RailIcon && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 inset-e-8 z-10 flex items-center justify-end"
          >
            <div className="animate-beacon-rail flex items-center gap-2 rounded-md border border-border-soft bg-warm px-2.5 py-1 shadow-sm">
              <RailIcon className={`h-3.5 w-3.5 shrink-0 ${railIcon[latest.type].color}`} />
              <span className="max-w-[10rem] truncate text-[12px] font-medium text-ink">
                {latest.title}
              </span>
              {moreCount > 0 && (
                <span className="shrink-0 text-[11px] font-semibold text-ink-tertiary tabular-nums">
                  +{moreCount}
                </span>
              )}
            </div>
          </div>
        )}
        {flash && (
          <div
            key={`announcement-${flash.id}`}
            className="sr-only"
            role={flash.type === 'error' ? 'alert' : 'status'}
            aria-live={flash.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            {liveAnnouncement}
          </div>
        )}
        {flash && (
          <div className="absolute inset-y-0 inset-e-4 z-10 flex items-stretch justify-end">
            <NotificationFlash
              key={flash.id}
              title={flash.title}
              type={flash.type}
              phase={flash.phase}
              color={contrastColor}
              barBackground={barBackground}
              onOpenPanel={openPanel}
              controlsId={PANEL_ID}
              isPanelExpanded={isPanelOpen}
            />
          </div>
        )}
        <span className="relative z-20 inline-flex shrink-0">
          <StatusDot
            overallStatus={overallStatus}
            isConnected={isConnected}
            hasRunningTasks={hasRunningTasks}
            onClick={togglePanel}
            popKey={popKey}
            color={contrastColor}
            controlsId={PANEL_ID}
            isExpanded={isPanelOpen}
          />
        </span>
      </div>
    </>
  );
};

export { RequestStatus };
