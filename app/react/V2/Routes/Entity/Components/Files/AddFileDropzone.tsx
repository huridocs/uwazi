import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { CloudUploadStrokeIcon } from '#V2/Components/CustomIcons/index.js';

const AddFileDropzone = ({
  onPick,
  onDropFile,
}: {
  onPick: () => void;
  onDropFile: (file: File | undefined) => void;
}) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onPick}
        onDragEnter={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          onDropFile(event.dataTransfer.files?.[0]);
        }}
        className={[
          'flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-warm py-6 transition-colors hover:bg-parchment',
          dragging ? 'border-ink/40' : 'border-border-soft',
        ].join(' ')}
      >
        <CloudUploadStrokeIcon className="mb-1.5 h-7 w-7 text-ink-tertiary/50" aria-hidden />
        <span className="text-sm font-medium text-ink-secondary">
          <Translate>Click to select files</Translate>
        </span>
        <span className="mt-0.5 text-xs text-ink-muted">
          <Translate>or drag and drop here</Translate>
        </span>
      </button>
      <p className="text-center text-xs text-ink-tertiary">
        <Translate>No files queued yet.</Translate>
      </p>
    </div>
  );
};

export { AddFileDropzone };
