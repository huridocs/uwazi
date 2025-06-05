import React from 'react';
import { CreateExtractorProvider } from './CreateExtractorContext';
import { Dialog } from './Dialog';

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
