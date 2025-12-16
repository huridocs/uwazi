import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { DocumentIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';
import { EntityFile } from 'app/V2/Routes/Entity/Components/FileCard';
import { AudioWaveformIcon } from 'V2/Components/CustomIcons';
import { MediaPlayer } from './MediaPlayer';

type FileIconProps = {
  file: EntityFile;
  className?: string;
  onDuration?: (duration: number) => void;
};

const FilePreview = ({ file, className, onDuration }: FileIconProps) => {
  const { url, filename, mimetype = '' } = file;
  const altText = file.originalname || file.url || 'Untitled';
  let type: 'image' | 'pdf' | 'audio' | 'video' | 'other';

  switch (true) {
    case /^image\//.test(mimetype) || file.fileType === 'image':
      type = 'image';
      break;

    case /^video\//.test(mimetype) || file.fileType === 'media':
      type = 'video';
      break;

    case /^audio\//.test(mimetype) || file.fileType === 'media':
      type = 'audio';
      break;

    case /^application\/pdf/.test(mimetype):
      type = 'pdf';
      break;

    default:
      type = 'other';
      break;
  }

  if (type === 'image') {
    return (
      <div className={`w-full h-full ${className || ''}`}>
        <img
          className="object-contain w-full h-full"
          src={file.url || ''}
          alt={altText || filename}
        />
      </div>
    );
  }

  if (type === 'audio') {
    const AudioPlayer = () => {
      const playerRef = useRef<ReactPlayer>(null);
      const [playing, setPlaying] = useState(false);

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
                  onDuration={onDuration}
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

    return <AudioPlayer />;
  }

  if (type === 'video') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
      >
        <figure
          aria-labelledby={altText}
          className="w-full h-full bg-gray-100 rounded-md overflow-hidden"
        >
          <MediaPlayer
            className="w-full h-full"
            url={url || ''}
            width="100%"
            height="100%"
            onDuration={onDuration}
          />
          {altText && (
            <figcaption className="sr-only" id={altText}>
              {altText}
            </figcaption>
          )}
        </figure>
      </div>
    );
  }

  if (type === 'pdf') {
    if (file.fileType === 'mainDocument') {
      return (
        <div className={`relative w-full h-full ${className || ''}`}>
          <div className="absolute left-4 top-4 z-10" aria-label="Default file">
            <StarIcon className="w-6 h-6 text-primary-500" aria-hidden="true" />
          </div>
          <img className="ml-8" src={`/api/files/${file._id}.jpg`} alt={altText || filename} />
        </div>
      );
    }
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
      >
        <BookOpenIcon className="w-12 h-12 text-gray-400" />
        <span className="sr-only">{altText || filename}</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}>
      <DocumentIcon className="w-12 h-12 text-gray-400" />
      <span className="sr-only">{altText || filename}</span>
    </div>
  );
};

export { FilePreview };
