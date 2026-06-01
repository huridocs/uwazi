import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileDetailsView } from './FileDetailsView.js';
import { FileDetailsEditor } from './FileDetailsEditor.js';

const FileSideTabContent = () => {
  const { focusedRow, isEditing, setIsEditing, requestDeleteRow, saveRow } = useEntityFiles();

  return (
    <div className="h-full overflow-auto">
      {focusedRow ? (
        isEditing ? (
          <FileDetailsEditor
            row={focusedRow}
            onSave={saveRow}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <FileDetailsView
            row={focusedRow}
            onEdit={() => setIsEditing(true)}
            onDelete={() => requestDeleteRow(focusedRow)}
          />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-ink-muted">
          <Translate>Select a file</Translate>
        </div>
      )}
    </div>
  );
};

export { FileSideTabContent };
