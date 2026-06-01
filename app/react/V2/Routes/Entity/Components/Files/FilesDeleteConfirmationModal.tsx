import React from 'react';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import { useEntityFiles } from './EntityFilesContext.js';

const FilesDeleteConfirmationModal = () => {
  const { pendingDeleteRow, closeDeleteModal, deleteRow } = useEntityFiles();

  if (!pendingDeleteRow) {
    return null;
  }

  return (
    <ConfirmationModal
      header="Delete file"
      body={`Are you sure you want to delete "${pendingDeleteRow.displayName}"?`}
      acceptButton="Delete"
      onCancelClick={closeDeleteModal}
      onAcceptClick={() => {
        void deleteRow();
      }}
      dangerStyle
    />
  );
};

export { FilesDeleteConfirmationModal };
