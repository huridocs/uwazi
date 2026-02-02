import React from 'react';
import { CreateExtractorProvider } from './CreateExtractorContext.js';
import { Dialog } from './Dialog.js';

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
