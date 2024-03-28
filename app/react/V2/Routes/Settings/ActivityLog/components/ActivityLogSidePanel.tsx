import React from 'react';
import { Sidepanel } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';

interface ActivityLogSidePanelProps {
  selectedEntry: ActivityLogEntryType;
  isOpen: boolean;
  onClose: () => void;
}
const ActivityLogSidePanel = ({ selectedEntry, isOpen, onClose }: ActivityLogSidePanelProps) => (
  <Sidepanel isOpen={isOpen} closeSidepanelFunction={onClose}>
    <Sidepanel.Body>
      <Translate>ACTIVITY</Translate>
      <>
        {selectedEntry.semantic.action !== 'RAW' && (
          <div className="gap-5">
            {selectedEntry.semantic.description && (
              <Translate className="font-semibold">{selectedEntry.semantic.description}</Translate>
            )}
            {selectedEntry.semantic.name && <Translate>{selectedEntry.semantic.name}</Translate>}
            {selectedEntry.semantic.extra && <Translate>{selectedEntry.semantic.extra}</Translate>}
          </div>
        )}
        {selectedEntry.semantic.action === 'RAW' && (
          <div className="gap-5">
            <Translate className="font-semibold">{selectedEntry.method}</Translate>
            <Translate>{selectedEntry.url}</Translate>
          </div>
        )}
      </>
      <Translate>User</Translate>
      <span>{selectedEntry.username}</span>
      <Translate>Query</Translate>
      <span>{selectedEntry.query}</span>
      <Translate>Body</Translate>
      <span>{selectedEntry.body}</span>
    </Sidepanel.Body>
  </Sidepanel>
);

export { ActivityLogSidePanel };
