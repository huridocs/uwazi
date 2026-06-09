import React from 'react';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import { useEntityFiles } from './EntityFilesContext.js';

const FilesDeleteConfirmationModal = () => {
  const { pendingDeleteRows, closeDeleteModal, deleteRows } = useEntityFiles();

  if (!pendingDeleteRows.length) {
    return null;
  }

  const isBulk = pendingDeleteRows.length > 1;
  const header = isBulk ? 'Delete files' : 'Delete file';
  const body = isBulk
    ? `Are you sure you want to delete ${pendingDeleteRows.length} files?`
    : `Are you sure you want to delete "${pendingDeleteRows[0].displayName}"?`;

  return (
    <ConfirmationModal
      header={header}
      body={body}
      acceptButton="Delete"
      onCancelClick={closeDeleteModal}
      onAcceptClick={() => {
        void deleteRows();
      }}
      dangerStyle
    />
  );
};

export { FilesDeleteConfirmationModal };
