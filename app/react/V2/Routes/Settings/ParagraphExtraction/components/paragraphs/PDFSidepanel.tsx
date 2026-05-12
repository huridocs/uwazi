import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { availableLanguages } from '#shared/language/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { Button, Sidepanel } from '#V2/Components/UI/index.js';
import { PDF } from '#V2/Components/PDFViewer/index.js';

interface PDFSidepanelSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  entity?: Entity;
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
      <Sidepanel.Body className="grow overflow-y-auto">
        {mainDocument && <PDF fileUrl={`/api/files/${mainDocument.filename}`} />}
      </Sidepanel.Body>
      <Sidepanel.Footer>
        <div className="sticky bottom-0 flex justify-end gap-2 border border-b-0 border-l-0 border-r-0 border-t px-4 py-2 bg-(--color-theme-surface-raised) border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)]">
          <Button
            type="button"
            variant="secondary"
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
