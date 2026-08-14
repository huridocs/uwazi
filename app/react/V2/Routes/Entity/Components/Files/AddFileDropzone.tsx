import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DashedUploadDropzone } from '#V2/Components/UI/DashedUploadDropzone.js';

const AddFileDropzone = ({
  onPick,
  onDropFile,
}: {
  onPick: () => void;
  onDropFile: (file: File | undefined) => void;
}) => (
  <div className="flex flex-col gap-4">
    <DashedUploadDropzone
      onPick={onPick}
      onDropFile={onDropFile}
      title={<Translate>Click to select files</Translate>}
      subtitle={<Translate>or drag and drop here</Translate>}
    />
    <p className="text-center text-xs text-ink-tertiary">
      <Translate>No files queued yet.</Translate>
    </p>
  </div>
);

export { AddFileDropzone };
