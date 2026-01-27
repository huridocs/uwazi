import React from 'react';
import { CreateExtractorProvider } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/CreateExtractorContext.js';
import { Dialog } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/Dialog.js';

const CreateDialog = ({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => (
  <>
    {isOpen && (
      <CreateExtractorProvider setShowModal={setIsOpen}>
        <Dialog />
      </CreateExtractorProvider>
    )}
  </>
);

export { CreateDialog };
