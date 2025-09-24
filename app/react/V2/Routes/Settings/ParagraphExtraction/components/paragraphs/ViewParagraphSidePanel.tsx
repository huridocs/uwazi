import React from 'react';
import { Link } from 'react-router';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI/Sidepan... Remove this comment to see the full error message
import { Sidepanel } from '../../V2/Components/UI/Sidepanel.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/V2/shared/Paragra... Remove this comment to see the full error message
import { TablePXEntityParagraphRow } from 'shared/V2/shared/ParagraphExtractionTypes.js';
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
    <Sidepanel.Body className="flex-grow overflow-y-auto">
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
