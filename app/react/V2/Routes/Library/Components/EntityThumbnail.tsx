import React from 'react';
import {
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

type ThumbnailKind = 'document' | 'image' | 'video' | 'audio';

type EntityThumbnailProps = {
  src?: string;
  kind?: ThumbnailKind;
  alt?: string;
  className?: string;
};

const kindFallback: Record<ThumbnailKind, React.ReactNode> = {
  document: (
    <div className="flex h-full w-full items-center justify-center bg-vellum">
      <div className="flex h-[78%] w-[38%] flex-col gap-1.5 rounded-[2px] bg-paper p-2 shadow-sm">
        <div className="h-1.5 w-2/3 rounded-full bg-border" />
        <div className="h-1 w-full rounded-full bg-border-soft" />
        <div className="h-1 w-full rounded-full bg-border-soft" />
        <div className="h-1 w-4/5 rounded-full bg-border-soft" />
      </div>
    </div>
  ),
  image: (
    <div className="flex h-full w-full items-center justify-center bg-carbon-tint">
      <PhotoIcon className="h-6 w-6 text-carbon/60" />
    </div>
  ),
  video: (
    <div className="flex h-full w-full items-center justify-center bg-ink">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/90">
        <PlayIcon className="ms-0.5 h-3.5 w-3.5 fill-current text-ink" />
      </div>
    </div>
  ),
  audio: (
    <div className="flex h-full w-full items-center justify-center bg-warm">
      <MusicalNoteIcon className="h-6 w-6 text-ink-tertiary" />
    </div>
  ),
};

const EntityThumbnail = ({ src, kind, alt = '', className = '' }: EntityThumbnailProps) => {
  if (src) {
    return (
      <div className={`overflow-hidden bg-warm ${className}`.trim()}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!kind) {
    return (
      <div className={`flex items-center justify-center bg-warm ${className}`.trim()}>
        <DocumentTextIcon className="h-6 w-6 text-ink-tertiary" />
      </div>
    );
  }

  return <div className={className}>{kindFallback[kind]}</div>;
};

export type { EntityThumbnailProps, ThumbnailKind };
export { EntityThumbnail };
