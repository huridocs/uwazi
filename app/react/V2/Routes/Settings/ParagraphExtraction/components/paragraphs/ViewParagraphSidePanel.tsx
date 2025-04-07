import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { Sidepanel } from 'app/V2/Components/UI/Sidepanel';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';
import { ViewParagraph } from './ViewParagraph';

type ViewParagraphSidePanelProps = {
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (isSidePanelOpen: boolean) => void;
  paragraphOnView: TablePXEntityParagraphRow | undefined;
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
    <Sidepanel.Body className="flex-grow overflow-y-scroll">
      {paragraphOnView && <ViewParagraph paragraphData={paragraphOnView} />}
    </Sidepanel.Body>
    <Sidepanel.Footer className="px-4 py-3 border-t">
      <div className="flex gap-2 justify-end">
        <Link
          to={`/${paragraphOnView?.language}/entity/${paragraphOnView?.sharedId}`}
          target="_blank"
        >
          <Button size="small" styling="outline">
            <Translate>View entity</Translate>
          </Button>
        </Link>
      </div>
    </Sidepanel.Footer>
  </Sidepanel>
);

export { ViewParagraphSidePanel };
