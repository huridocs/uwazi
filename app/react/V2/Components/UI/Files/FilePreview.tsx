import React from 'react';
import { DocumentIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { EntityFile } from './FileCard.js';
import { VideoPlayer } from './VideoPlayer.js';
import { AudioPlayer } from './AudioPlayer.js';

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
    return (
      <AudioPlayer
        url={url || ''}
        className={className || ''}
        altText={altText || filename}
        onDuration={onDuration}
      />
    );
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
          <VideoPlayer
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
