import React from 'react';
import { DocumentIcon, BookOpenIcon, PlayIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AudioWaveformIcon } from 'V2/Components/CustomIcons';
import { MediaPlayer } from 'app/V2/Components/UI';
import { FileType } from 'shared/types/fileType';

type FileCardDisplayProps = {
  file: FileType & { fileType: 'mainDocument' | 'document' | 'attachment' };
  className?: string;
};

const FileCardDisplay = ({ file, className }: FileCardDisplayProps) => {
  const { url, filename, mimetype = '' } = file;
  const altText = file.originalname || file.url || 'Untitled';
  let type: 'image' | 'pdf' | 'audio' | 'video' | 'other';

  switch (true) {
    case /^image\//.test(mimetype):
      type = 'image';
      break;

    case /^audio\//.test(mimetype):
      type = 'audio';
      break;

    case /^video\//.test(mimetype):
      type = 'video';
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
      <div className={className}>
        <img
          className="object-scale-down w-full h-full"
          src={`/api/files/${filename}`}
          alt={altText || filename}
        />
      </div>
    );
  }

  if (file.fileType === 'mainDocument') {
    return (
      <div className={className}>
        <StarIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
        <img
          className="object-scale-down w-full h-full"
          src={`/api/files/${file._id}.jpg`}
          alt={altText || filename}
        />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-white ${className || ''}`}
      >
        <AudioWaveformIcon className="absolute inset-0 w-full h-full" />
        <PlayIcon className="relative w-12 h-12 text-gray-700" />
        <figure aria-labelledby={altText} className="w-full bg-gray-100 rounded-md">
          <MediaPlayer className="m-auto" url={url || ''} width={500} height={300} />
          {altText && (
            <figcaption className="sr-only" id={altText}>
              {altText}
            </figcaption>
          )}
        </figure>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
      >
        <figure aria-labelledby={altText} className="w-full bg-gray-100 rounded-md">
          <MediaPlayer className="m-auto" url={url || ''} width={500} height={300} />
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

export { FileCardDisplay };
