import React, { useEffect, useRef, useState } from 'react';
import { AudioWaveformIcon } from 'V2/Components/CustomIcons';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

type AudioPlayerProps = {
  url: string;
  className?: string;
  altText?: string;
  onDuration?: (duration: number) => void;
};

const AudioPlayer = ({ url, className, altText, onDuration }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (audioRef.current && onDuration) {
      const handleLoadedMetadata = () => {
        if (audioRef.current?.duration && Number.isFinite(audioRef.current.duration)) {
          onDuration(audioRef.current.duration);
        }
      };
      const audio = audioRef.current;
      if (audio.readyState >= 1 && audio.duration && Number.isFinite(audio.duration)) {
        onDuration(audio.duration);
      } else {
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }
  }, [onDuration, url]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
    >
      <figure
        aria-labelledby={altText}
        className="relative w-full h-full flex flex-col items-center justify-center bg-white rounded-md overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <AudioWaveformIcon className="w-full h-full" />
        </div>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            ref={audioRef}
            src={url || ''}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={playing ? 'Pause audio' : 'Play audio'}
            className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset"
          >
            {playing ? (
              <PauseIcon className="w-8 h-8 text-gray-700" />
            ) : (
              <PlayIcon className="w-8 h-8 text-gray-700 ml-1" />
            )}
          </button>
        </div>
        {altText && (
          <figcaption className="sr-only" id={altText}>
            {altText}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

export default AudioPlayer;
