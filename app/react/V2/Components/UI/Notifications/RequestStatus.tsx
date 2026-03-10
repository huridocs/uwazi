import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { StatusDot } from './StatusDot.js';
import { NotificationsPanel } from './NotificationsPanel.js';
import { NotificationFlash } from './NotificationFlash.js';

interface FlashState {
  id: string;
  title: string;
  type: 'error' | 'warning';
  phase: 'showing' | 'leaving';
}

const RequestStatus = () => {
  const {
    overallStatus,
    isConnected,
    hasRunningTasks,
    isPanelOpen,
    notifications,
    tasks,
    togglePanel,
    removeNotification,
    removeTask,
    clearAll,
  } = useRequestStatus();

  const [flash, setFlash] = useState<FlashState | null>(null);
  const lastFlashId = useRef<string | null>(null);
  // Timers are stored in refs so they are only cleared when a new flash starts,
  // not on every notifications change (which was causing the flash to get stuck).
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [popKey, setPopKey] = useState(0);
  const lastPopId = useRef<string | null>(null);

  const startFlash = useCallback((id: string, title: string, type: 'error' | 'warning') => {
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
    if (!latest || (latest.type !== 'error' && latest.type !== 'warning')) return;
    if (latest.id === lastFlashId.current) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <>
      <div className="flex items-center bg-warning-50 p-1 rounded-xl gap-1.5">
        {flash && (
          <NotificationFlash
            key={flash.id}
            title={flash.title}
            type={flash.type}
            phase={flash.phase}
          />
        )}
        <StatusDot
          overallStatus={overallStatus}
          isConnected={isConnected}
          hasRunningTasks={hasRunningTasks}
          onClick={togglePanel}
          popKey={popKey}
        />
      </div>
      <NotificationsPanel
        isOpen={isPanelOpen}
        notifications={notifications}
        tasks={tasks}
        onClose={togglePanel}
        onDismissNotification={removeNotification}
        onRemoveTask={removeTask}
        onClear={clearAll}
      />
    </>
  );
};

export { RequestStatus };
