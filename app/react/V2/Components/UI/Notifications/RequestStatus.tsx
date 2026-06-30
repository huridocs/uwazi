import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import type { NotificationType } from '#V2/atoms/requestStatusAtom.js';
import { CsvImportTasksSubscriber } from '#V2/Routes/Settings/CSVUpload/CsvImportTasksSubscriber.js';
import { Beacon, type FlashState } from './Beacon.js';

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

const RequestStatus = () => {
  const {
    overallStatus,
    isConnected,
    hasRunningTasks,
    isPanelOpen,
    notifications,
    tasks,
    togglePanel,
    isLoading,
  } = useRequestStatus();

  const [flash, setFlash] = useState<FlashState | null>(null);
  const lastFlashId = useRef<string | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [popKey, setPopKey] = useState(0);
  const lastPopId = useRef<string | null>(null);
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

    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      setFlash(f => (f ? { ...f, phase: 'leaving' } : null));
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null;
        setFlash(null);
      }, 420);
    }, 3200);
  }, []);

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
  }, [notifications, startFlash]);

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

  return (
    <>
      <CsvImportTasksSubscriber />
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
      <Beacon
        overallStatus={overallStatus}
        isConnected={isConnected}
        hasRunningTasks={hasRunningTasks}
        isLoading={isLoading}
        isPanelOpen={isPanelOpen}
        tasks={tasks}
        notifications={notifications}
        flash={flash}
        popKey={popKey}
        onClick={togglePanel}
        controlsId={PANEL_ID}
      />
    </>
  );
};

export { RequestStatus };
