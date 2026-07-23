import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FileDetailsView } from '../../Components/Files/FileDetailsView.js';
import { FileDetailsEditor } from '../../Components/Files/FileDetailsEditor.js';
import { FilePreviewView } from '../../Components/Files/FilePreviewView.js';

const FilesSideTab = () => {
  const { focusedRow, isEditing, editFocus, filePanelMode, setIsEditing, saveRow } =
    useEntityFiles();

  let body: React.ReactNode;

  if (!focusedRow) {
    body = (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>Select a file</Translate>
      </div>
    );
  } else if (isEditing) {
    body = (
      <div className="h-full overflow-auto">
        <FileDetailsEditor row={focusedRow} onSave={saveRow} focusField={editFocus} />
      </div>
    );
  } else if (filePanelMode === 'preview') {
    body = (
      <div className="h-full overflow-auto">
        <FilePreviewView row={focusedRow} />
      </div>
    );
  } else {
    body = (
      <div className="h-full overflow-auto">
        <FileDetailsView row={focusedRow} onEdit={() => setIsEditing(true)} />
      </div>
    );
  }

  return <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>;
};

export { FilesSideTab };
