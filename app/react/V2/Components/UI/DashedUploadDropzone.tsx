import React, { useState } from 'react';
import { CloudUploadStrokeIcon } from '#V2/Components/CustomIcons/index.js';

type DashedUploadDropzoneProps = {
  onPick: () => void;
  onDropFiles: (files: File[]) => void;
  disabled?: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
};

const DashedUploadDropzone = ({
  onPick,
  onDropFiles,
  disabled,
  title,
  subtitle,
}: DashedUploadDropzoneProps) => {
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      onDragEnter={event => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={event => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        onDropFiles(Array.from(event.dataTransfer.files ?? []));
      }}
      className={[
        'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-warm py-6 transition-colors',
        dragging ? 'border-ink/40' : 'border-border-soft',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-parchment',
      ].join(' ')}
    >
      <CloudUploadStrokeIcon className="mb-1.5 h-7 w-7 text-ink-tertiary/50" aria-hidden />
      <span className="text-sm font-medium text-ink-secondary">{title}</span>
      {subtitle ? <span className="mt-0.5 text-xs text-ink-muted">{subtitle}</span> : null}
    </button>
  );
};

export { DashedUploadDropzone };
export type { DashedUploadDropzoneProps };
