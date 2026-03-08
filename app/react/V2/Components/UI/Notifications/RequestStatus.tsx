import React, { useEffect, useRef, useState } from 'react';
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
    clearAll,
  } = useRequestStatus();

  const [flash, setFlash] = useState<FlashState | null>(null);
  const lastFlashId = useRef<string | null>(null);

  useEffect(() => {
    const latest = notifications[notifications.length - 1];
    if (!latest || (latest.type !== 'error' && latest.type !== 'warning')) return;
    if (latest.id === lastFlashId.current) return;
    lastFlashId.current = latest.id;

    setFlash({ id: latest.id, title: latest.title, type: latest.type, phase: 'showing' });

    // 3400ms = ~350ms enter animation + 3000ms hold
    const leaveTimer = setTimeout(() => {
      setFlash(f => (f ? { ...f, phase: 'leaving' } : null));
      setTimeout(() => setFlash(null), 350);
    }, 3400);

    return () => clearTimeout(leaveTimer);
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
        />
      </div>
      <NotificationsPanel
        isOpen={isPanelOpen}
        notifications={notifications}
        tasks={tasks}
        onClose={togglePanel}
        onDismissNotification={removeNotification}
        onClear={clearAll}
      />
    </>
  );
};

export { RequestStatus };
