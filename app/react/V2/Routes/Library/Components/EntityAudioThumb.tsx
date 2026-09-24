import React, { useEffect, useState } from 'react';
import { PlayIcon } from '@heroicons/react/20/solid';

type EntityAudioThumbProps = {
  src: string;
  className?: string;
};

const stopCardActivation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const renderEqualizer = () => (
  <svg
    data-testid="entity-audio-equalizer"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="h-10 w-10 text-blue-600"
  >
    <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
    <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
    <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
    <rect x="15.5" y="6" width="2.5" height="12" rx="1.25" />
    <rect x="20" y="8" width="2.5" height="8" rx="1.25" />
  </svg>
);

const EntityAudioThumb = ({ src, className = '' }: EntityAudioThumbProps) => {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
  }, [src]);

  const thumbClass = `group relative flex items-center justify-center bg-warm ${className}`.trim();

  if (!started) {
    return (
      <button
        type="button"
        aria-label="Play audio"
        data-testid="entity-audio-thumb"
        className={thumbClass}
        onClick={event => {
          stopCardActivation(event);
          setStarted(true);
        }}
      >
        {renderEqualizer()}
        <span
          data-testid="entity-audio-play"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <PlayIcon className="ms-0.5 h-5 w-5 text-ink" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      data-testid="entity-audio-thumb"
      className={thumbClass}
      onClick={stopCardActivation}
      onKeyDown={stopCardActivation}
      role="presentation"
    >
      {renderEqualizer()}
      <audio
        src={src}
        autoPlay
        controls
        className="absolute inset-x-2 bottom-2 h-8 w-[calc(100%-1rem)]"
      >
        <track kind="captions" />
      </audio>
    </div>
  );
};

export type { EntityAudioThumbProps };
export { EntityAudioThumb };
