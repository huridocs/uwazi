import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

const FileUploadProgressLine = ({ progress }: { progress: number }) => {
  const bounded = Math.max(0, Math.min(100, progress));
  const isReady = bounded >= 100;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 flex-1 overflow-hidden rounded bg-vellum"
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bounded}
        aria-valuetext={isReady ? 'Ready' : `${bounded}%`}
      >
        <div
          className={`h-full transition-[width] duration-200 ${isReady ? 'bg-success' : 'bg-ink-fade'}`}
          style={{ width: `${bounded}%` }}
        />
      </div>
      {isReady ? (
        <span className="flex items-center gap-1 text-nano font-medium text-success">
          <CheckIcon className="h-nano w-nano" />
          <Translate>Ready</Translate>
        </span>
      ) : (
        <span className="text-nano tabular-nums text-ink-tertiary">{bounded}%</span>
      )}
    </div>
  );
};

export { FileUploadProgressLine };
