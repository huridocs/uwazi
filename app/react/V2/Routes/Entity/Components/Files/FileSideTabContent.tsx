import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileDetailsView } from './FileDetailsView.js';
import { FileDetailsEditor } from './FileDetailsEditor.js';
import { FilePreviewView } from './FilePreviewView.js';

const FileSideTabContent = () => {
  const { focusedRow, isEditing, filePanelMode, setIsEditing, saveRow } = useEntityFiles();

  if (!focusedRow) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>Select a file</Translate>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="h-full overflow-auto">
        <FileDetailsEditor row={focusedRow} onSave={saveRow} />
      </div>
    );
  }

  if (filePanelMode === 'preview') {
    return (
      <div className="h-full overflow-auto">
        <FilePreviewView row={focusedRow} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <FileDetailsView row={focusedRow} onEdit={() => setIsEditing(true)} />
    </div>
  );
};

export { FileSideTabContent };
