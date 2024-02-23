import React from 'react';
import { Sidepanel } from 'app/V2/Components/UI';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';

interface ActivityLogSidePanelProps {
  selectedEntry: ActivityLogEntryType;
  isOpen: boolean;
  onClose: () => void;
}
const ActivityLogSidePanel = ({ selectedEntry, isOpen, onClose }: ActivityLogSidePanelProps) => (
  <Sidepanel isOpen={isOpen} closeSidepanelFunction={onClose}>
    <Sidepanel.Body>
      <span>{selectedEntry.method}</span>
    </Sidepanel.Body>
  </Sidepanel>
);

export { ActivityLogSidePanel };
