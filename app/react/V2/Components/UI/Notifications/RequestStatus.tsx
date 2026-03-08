import React from 'react';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { StatusDot } from './StatusDot.js';
import { NotificationsPanel } from './NotificationsPanel.js';

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

  return (
    <>
      <StatusDot
        overallStatus={overallStatus}
        isConnected={isConnected}
        hasRunningTasks={hasRunningTasks}
        onClick={togglePanel}
      />
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
