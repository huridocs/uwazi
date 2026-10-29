import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DashedUploadDropzone } from '#V2/Components/UI/DashedUploadDropzone.js';

const AddFileDropzone = ({
  onPick,
  onDropFiles,
  queued = false,
  disabled = false,
}: {
  onPick: () => void;
  onDropFiles: (files: File[]) => void;
  queued?: boolean;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-4">
    <DashedUploadDropzone
      onPick={onPick}
      onDropFiles={onDropFiles}
      disabled={disabled}
      title={<Translate>Click to select files</Translate>}
      subtitle={<Translate>or drag and drop here</Translate>}
    />
    {!queued && (
      <p className="text-center text-xs text-ink-tertiary">
        <Translate>No files queued yet.</Translate>
      </p>
    )}
  </div>
);

export { AddFileDropzone };
