import React from 'react';
import { Translate } from 'app/I18N';
import { availableLanguages } from 'shared/language';
import { ClientEntitySchema } from 'app/istore';
import { Button, Sidepanel } from 'V2/Components/UI';
import { PDF } from 'V2/Components/PDFViewer';

interface PDFSidepanelSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  entity?: ClientEntitySchema;
}

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, entity }: PDFSidepanelSidepanelProps) => {
  const defaultLanguage = availableLanguages.find(lang => lang.key === entity?.language);
  const mainDocument =
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
