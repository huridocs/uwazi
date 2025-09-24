import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { availableLanguages } from 'shared/language/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientEntitySchema } from '../../istore.js';
import { Button, Sidepanel } from '../../../../../Components/UI/index.js';
import { PDF } from '../../../../../Components/PDFViewer/index.js';

interface PDFSidepanelSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  entity?: ClientEntitySchema;
}

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, entity }: PDFSidepanelSidepanelProps) => {
  // @ts-expect-error TS(7006): Parameter 'lang' implicitly has an 'any' type.
  const defaultLanguage = availableLanguages.find(lang => lang.key === entity?.language);
  const mainDocument =
    // @ts-expect-error TS(7006): Parameter 'document' implicitly has an 'any' type.
    entity?.documents?.find(document => document.language === defaultLanguage?.ISO639_3) ||
    (entity?.documents && entity.documents[0]);

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={entity?.title}
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <Sidepanel.Body className="flex-grow overflow-y-auto">
        {mainDocument && <PDF fileUrl={`/api/files/${mainDocument.filename}`} />}
      </Sidepanel.Body>
      <Sidepanel.Footer>
        <div className="sticky bottom-0 flex justify-end gap-2 px-4 py-2 bg-white border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
          <Button
            type="button"
            styling="outline"
            onClick={() => {
              setShowSidepanel(false);
            }}
          >
            <Translate>Close</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { PDFSidepanel };
