import React from 'react';
import { Sidepanel } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { ActivityLogEntryType } from '#shared/types/activityLogEntryType.js';
import { ActionPill } from './TableElements.js';

interface ActivityLogSidePanelProps {
  selectedEntry?: ActivityLogEntryType;
  isOpen: boolean;
  onClose: () => void;
}
const ActivityLogSidePanel = ({ selectedEntry, isOpen, onClose }: ActivityLogSidePanelProps) => (
  <Sidepanel
    withOverlay
    isOpen={isOpen}
    closeSidepanelFunction={onClose}
    title={<Translate className="uppercase">Activity</Translate>}
    data-testid="activity-log-detail"
  >
    <Sidepanel.Body>
      {selectedEntry !== undefined && (
        <>
          <div className="flex flex-col">
            <div className="flex flex-row justify-between w-full p-5 my-2 rounded-lg bg-warm">
              {selectedEntry.semantic.action !== 'RAW' && (
                <>
                  <div className="flex-col">
                    {selectedEntry.semantic.description && (
                      <div>
                        <Translate className="font-semibold text-ink">
                          {selectedEntry.semantic.description}
                        </Translate>
                        &#58;
                      </div>
                    )}
                    <div>
                      {selectedEntry.semantic.name && (
                        <Translate>{selectedEntry.semantic.name}</Translate>
                      )}
                      {selectedEntry.semantic.extra && (
                        <Translate>{selectedEntry.semantic.extra}</Translate>
                      )}
                    </div>
                  </div>
                  <ActionPill className="h-6" action={selectedEntry.semantic.action} />
                </>
              )}
              {selectedEntry.semantic.action === 'RAW' && (
                <div className="content-start gap-x-1">
                  <Translate className="font-semibold">{selectedEntry.method}</Translate>&#58;
                  <Translate>{selectedEntry.url}</Translate>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row justify-between w-full p-5 my-2 border rounded-lg border-border bg-warm">
            <div className="flex flex-col">
              <Translate className="font-semibold">User</Translate>
              <span className="text-ink">{selectedEntry.username}</span>
            </div>
          </div>
          <div className="flex flex-col grow p-3 rounded-lg max-h-svh h-3/4">
            <Translate className="m-2 font-semibold">Query</Translate>
            <span className="block p-5 mb-4 text-ink border border-border rounded-lg bg-warm">
              {selectedEntry.query}
            </span>
            <Translate className="m-2 font-semibold">Body</Translate>
            <span className="block w-full p-3 overflow-auto text-ink border border-border rounded-lg bg-warm ">
              {selectedEntry.body}
            </span>
          </div>
        </>
      )}
    </Sidepanel.Body>
  </Sidepanel>
);

export { ActivityLogSidePanel };
