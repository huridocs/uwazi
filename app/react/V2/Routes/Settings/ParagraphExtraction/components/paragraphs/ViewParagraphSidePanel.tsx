import React from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { Sidepanel } from 'app/V2/Components/UI/Sidepanel';
import { ViewParagraph } from './ViewParagraph';
import { PXParagraphTable } from '../../types';

type ViewParagraphSidePanelProps = {
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (isSidePanelOpen: boolean) => void;
  paragraphOnView: PXParagraphTable | undefined;
};

const ViewParagraphSidePanel = ({
  isSidePanelOpen,
  setIsSidePanelOpen,
  paragraphOnView,
}: ViewParagraphSidePanelProps) => (
  <Sidepanel
    withOverlay
    isOpen={isSidePanelOpen}
    closeSidepanelFunction={() => {
      setIsSidePanelOpen(false);
    }}
    title={
      <span className="text-base font-semibold text-gray-500 leading-6 uppercase">
        <Translate>Entity</Translate>
      </span>
    }
  >
    <Sidepanel.Body>
      {paragraphOnView && <ViewParagraph paragraphData={paragraphOnView} />}
    </Sidepanel.Body>
    <Sidepanel.Footer className="px-4 py-3 border-t">
      <div className="flex gap-2 justify-end">
        <Button size="small" styling="outline">
          <Translate>View entity</Translate>
        </Button>
      </div>
    </Sidepanel.Footer>
  </Sidepanel>
);

export { ViewParagraphSidePanel };
