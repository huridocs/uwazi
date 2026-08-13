import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { FileKind } from './types.js';

const thumbnailChipLabel = (kind: FileKind) => {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'image') return 'IMG';
  return 'DOC';
};

const FileThumbnail = ({ kind }: { kind: FileKind }) => {
  const wrap = 'flex w-16 shrink-0 items-center justify-center self-stretch rounded-l-md';

  if (kind === 'link') {
    return (
      <div className={`${wrap} bg-seal`}>
        <span className="text-tiny font-bold text-white">
          <Translate>Link</Translate>
        </span>
      </div>
    );
  }

  if (kind === 'audio' || kind === 'video') {
    return (
      <div className={`${wrap} bg-warm`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-parchment shadow-sm">
          <div className="ml-0.5 h-0 w-0 border-y-4 border-l-arrow border-y-transparent border-l-ink" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${wrap} bg-warm`}>
      <div className="flex h-11 w-9 items-center justify-center rounded bg-paper shadow-sm">
        <span className="text-pico text-ink-muted">{thumbnailChipLabel(kind)}</span>
      </div>
    </div>
  );
};

export { FileThumbnail };
