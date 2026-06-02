import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileDetailsView } from './FileDetailsView.js';
import { FileDetailsEditor } from './FileDetailsEditor.js';

const FileSideTabContent = () => {
  const { focusedRow, isEditing, setIsEditing, saveRow } = useEntityFiles();

  if (!focusedRow) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>Select a file</Translate>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {isEditing ? (
        <FileDetailsEditor row={focusedRow} onSave={saveRow} />
      ) : (
        <FileDetailsView row={focusedRow} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
};

export { FileSideTabContent };
