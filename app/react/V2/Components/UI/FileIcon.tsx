import React from 'react';
import { VideoCameraIcon, DocumentIcon, BookOpenIcon } from '@heroicons/react/24/outline';

type FileIconProps = {
  filename: string;
  mimetype: string;
  altText?: string;
  className?: string;
};

const FileIcon = ({ mimetype = '', filename, altText, className }: FileIconProps) => {
  let type: 'image' | 'pdf' | 'media' | 'other';

  switch (true) {
    case /^image\//.test(mimetype):
      type = 'image';
      break;

    case /^audio\//.test(mimetype):
      type = 'media';
      break;

    case /^video\//.test(mimetype):
      type = 'media';
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

  if (type === 'media') {
    return (
      <div className={className || 'w-full h-full'}>
        <span className="sr-only">{altText || filename}</span>
        <VideoCameraIcon />
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <div className={className || 'w-full h-full'}>
        <span className="sr-only">{altText || filename}</span>
        <BookOpenIcon />
      </div>
    );
  }

  return (
    <div className={className || 'w-full h-full'}>
      <span className="sr-only">{altText || filename}</span>
      <DocumentIcon />
    </div>
  );
};

export { FileIcon };
