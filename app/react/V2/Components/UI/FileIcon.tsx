import React from 'react';
import {
  VideoCameraIcon,
  DocumentIcon,
  BookOpenIcon,
  LinkIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { AudioWaveformIcon } from 'V2/Components/CustomIcons';

type FileIconProps = {
  filename: string;
  mimetype: string;
  altText?: string;
  className?: string;
  thumbnailUrl?: string;
  isLink?: boolean;
};

const FileIcon = ({
  mimetype = '',
  filename,
  altText,
  className,
  thumbnailUrl,
  isLink,
}: FileIconProps) => {
  if (isLink) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
      >
        <LinkIcon className="w-12 h-12 text-gray-400" />
        <span className="sr-only">{altText || filename}</span>
      </div>
    );
  }

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

  if (type === 'audio') {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-white ${className || ''}`}
      >
        <AudioWaveformIcon className="absolute inset-0 w-full h-full" />
        <PlayIcon className="relative w-12 h-12 text-gray-700" />
      </div>
    );
  }

  if (type === 'video') {
    if (thumbnailUrl) {
      return (
        <div className={className || 'w-full h-full'}>
          <img
            src={thumbnailUrl}
            alt={altText || filename}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-50 ${className || ''}`}
      >
        <VideoCameraIcon className="w-12 h-12 text-gray-400" />
        <span className="sr-only">{altText || filename}</span>
      </div>
    );
  }

  if (type === 'pdf') {
    if (thumbnailUrl) {
      return (
        <div className={className || 'w-full h-full'}>
          <img
            src={thumbnailUrl}
            alt={altText || filename}
            className="w-full h-full object-cover"
          />
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

export { FileIcon };
