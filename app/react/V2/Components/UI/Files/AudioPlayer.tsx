import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { AudioWaveformIcon } from 'V2/Components/CustomIcons';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

type AudioPlayerProps = {
  url: string;
  className?: string;
  altText?: string;
};

const AudioPlayer = ({ url, className, altText }: AudioPlayerProps) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [, setDuration] = useState<number | undefined>(undefined);

  const handleDuration = (dur: number) => {
    if (dur && isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
  };

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

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
          <div className="absolute inset-0 opacity-0 pointer-events-none">
            <ReactPlayer
              className="w-full h-full"
              ref={playerRef}
              url={url || ''}
              width="100%"
              height="100%"
              controls={false}
              playing={playing}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onDuration={handleDuration}
            />
          </div>
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
