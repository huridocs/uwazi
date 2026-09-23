import React, { useEffect, useState } from 'react';
import { PlayIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { EntityAudioThumb } from './EntityAudioThumb.js';
import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
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

const youtubeEmbedUrl = (url: string): string | undefined => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : undefined;
};

const vimeoEmbedUrl = (url: string): string | undefined => {
  const match = url.match(/(?:vimeo\.com\/)(?:.*\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : undefined;
};

const stopCardActivation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const renderVideoPlayer = (src: string, className: string) => {
  const embed = youtubeEmbedUrl(src) || vimeoEmbedUrl(src);
  return (
    <div
      className={`overflow-hidden bg-black ${className}`.trim()}
      onClick={stopCardActivation}
      onKeyDown={stopCardActivation}
      role="presentation"
    >
      {embed ? (
        <iframe
          title="Video"
          src={embed}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={src} autoPlay controls playsInline className="h-full w-full object-cover">
          <track kind="captions" />
        </video>
      )}
    </div>
  );
};

const renderVideoPoster = (className: string, onPlay: () => void) => (
  <button
    type="button"
    aria-label="Play video"
    className={`group flex items-center justify-center bg-black ${className}`.trim()}
    onClick={event => {
      stopCardActivation(event);
      onPlay();
    }}
  >
    <span
      data-testid="entity-video-play"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      <PlayIcon className="ms-0.5 h-5 w-5 text-ink" />
    </span>
  </button>
);

const renderImageThumb = ({
  src,
  alt,
  fit,
  className,
  onError,
}: {
  src: string;
  alt: string;
  fit: ThumbFit;
  className: string;
  onError: () => void;
}) => {
  const matted = imageIsMatted(fit);
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${matted ? 'bg-vellum' : 'bg-warm'} ${className}`.trim()}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full ${matted ? 'object-contain' : 'object-cover'}`}
        onError={onError}
      />
    </div>
  );
};

const renderThumbnail = ({
  src,
  alt,
  kind,
  fit,
  frame,
  className,
  color,
  failed,
  videoStarted,
  onImageError,
  onPlayVideo,
}: {
  src?: string;
  alt: string;
  kind?: ThumbnailKind;
  fit: ThumbFit;
  frame: ThumbFrame;
  className: string;
  color: string;
  failed: boolean;
  videoStarted: boolean;
  onImageError: () => void;
  onPlayVideo: () => void;
}) => {
  if (!src || failed) {
    return renderQuietMark(color, className);
  }
  if (kind === 'document') {
    return renderDocumentPreview({
      src,
      alt,
      portrait: frame === 'portrait',
      className,
      onError: onImageError,
    });
  }
  if (kind === 'audio') {
    return <EntityAudioThumb src={src} className={className} />;
  }
  if (kind === 'video') {
    return videoStarted
      ? renderVideoPlayer(src, className)
      : renderVideoPoster(className, onPlayVideo);
  }
  return renderImageThumb({
    src,
    alt,
    fit,
    className,
    onError: onImageError,
  });
};

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
  const [videoStarted, setVideoStarted] = useState(false);
  const color = tint ?? DEFAULT_TINT;

  useEffect(() => {
    setFailed(false);
    setVideoStarted(false);
  }, [src]);

  return renderThumbnail({
    src,
    alt,
    kind,
    fit,
    frame,
    className,
    color,
    failed,
    videoStarted,
    onImageError: () => setFailed(true),
    onPlayVideo: () => setVideoStarted(true),
  });
};

export type { EntityThumbnailProps };
export { EntityThumbnail };
