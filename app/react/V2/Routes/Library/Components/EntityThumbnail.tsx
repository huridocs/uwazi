import React, { useEffect, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  imageAspect,
  imageIsMatted,
  type ThumbFit,
  type ThumbFrame,
  type ThumbnailKind,
} from './libraryCardDisplay.js';

type EntityThumbnailProps = {
  src?: string;
  alt?: string;
  tint?: string;
  kind?: ThumbnailKind;
  fit?: ThumbFit;
  frame?: ThumbFrame;
  className?: string;
};

const DEFAULT_TINT = '#6B7280';

const documentSheetClass = (portrait: boolean) =>
  portrait
    ? 'absolute inset-0 overflow-hidden bg-paper'
    : 'absolute inset-x-[16%] top-[10%] -bottom-[15%] overflow-hidden rounded-t-[3px] border border-border-soft bg-paper shadow-sm';

const documentImageClass = (portrait: boolean) =>
  portrait ? 'h-full w-full object-cover object-top' : 'block w-full';

const renderQuietMark = (color: string, className: string) => (
  <span
    data-testid="entity-quiet-mark"
    className={`flex items-center justify-center bg-vellum ${className}`.trim()}
  >
    <span
      className="flex aspect-square h-[34%] max-h-12 min-h-5 items-center justify-center rounded-md"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      <span className="aspect-square w-[38%] rounded-[2px]" style={{ backgroundColor: color }} />
    </span>
  </span>
);

const renderDocumentPreview = ({
  src,
  alt,
  portrait,
  className,
  onError,
}: {
  src: string;
  alt: string;
  portrait: boolean;
  className: string;
  onError: () => void;
}) => (
  <div className={`group relative overflow-hidden bg-vellum ${className}`.trim()}>
    <div data-testid="document-preview-sheet" className={documentSheetClass(portrait)}>
      <img src={src} alt={alt} className={documentImageClass(portrait)} onError={onError} />
    </div>
    <Translate className="absolute bottom-1 inset-e-1 rounded-xs bg-ink px-1 py-px text-pico font-semibold uppercase leading-none tracking-wider text-parchment">
      PDF
    </Translate>
  </div>
);

const EntityThumbnail = ({
  src,
  alt = '',
  tint,
  kind,
  fit = DEFAULT_THUMB_FIT,
  frame = DEFAULT_THUMB_FRAME,
  className = '',
}: EntityThumbnailProps) => {
  const [failed, setFailed] = useState(false);
  const [aspect, setAspect] = useState<ThumbFrame | 'square'>();
  const color = tint ?? DEFAULT_TINT;

  useEffect(() => {
    setFailed(false);
    setAspect(undefined);
  }, [src]);

  if (!src || failed) {
    return renderQuietMark(color, className);
  }

  if (kind === 'document') {
    return renderDocumentPreview({
      src,
      alt,
      portrait: frame === 'portrait',
      className,
      onError: () => setFailed(true),
    });
  }

  const matted = imageIsMatted(fit, frame, aspect);
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${matted ? 'bg-vellum' : 'bg-warm'} ${className}`.trim()}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full ${matted ? 'object-contain' : 'object-cover'}`}
        onLoad={event => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalHeight) {
            setAspect(imageAspect(naturalWidth, naturalHeight));
          }
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export type { EntityThumbnailProps };
export { EntityThumbnail };
