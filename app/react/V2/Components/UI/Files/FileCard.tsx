import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { FilePreview } from '#app/V2/Components/UI/Files/FilePreview.js';
import { settingsAtom } from '#app/V2/atoms/index.js';
import { formatBytes, formatDuration, getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { FileType } from '#shared/types/fileType.js';

type EntityFile = Partial<FileType> & {
  fileType: 'mainDocument' | 'document' | 'attachment' | 'externalURL' | 'image' | 'media';
  duration?: number;
};

type FileCardProps = {
  file: EntityFile;
  index: number;
  onFileSelect?: (file: FileType) => void;
  translations?: FileType[];
};

const getFileTypeLabel = (file: EntityFile) => {
  if (file.fileType === 'externalURL') {
    return 'Link';
  }
  const mimeType = file.mimetype || getMimetypeFromUrl(file.url || '');
  if (mimeType) {
    const parts = mimeType.split('/');
    return parts[parts.length - 1].toUpperCase();
  }
  return file.fileType === 'document'
    ? t('System', 'Document', null, false)
    : t('System', 'Attachment', null, false);
};

const FileCard = ({ file, index, onFileSelect = () => {}, translations = [] }: FileCardProps) => {
  const fileUrl = file.url || (file.filename ? `/api/files/${file.filename}` : '');
  const downloadUrl = file.filename ? `${fileUrl}?download=true` : fileUrl;
  const fileSize = file.size ? formatBytes(file.size) : 'n/a';
  const isSelected = false;
  const fileName = file.originalname || file.url || 'Untitled';
  const fileTypeLabel = getFileTypeLabel(file);
  const isMediaFile = file.fileType === 'media' || /^(audio|video)\//.test(file.mimetype || '');
  const isExternalUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
  const [duration, setDuration] = useState<number | undefined>(file.duration);
  const { languages } = useAtomValue(settingsAtom);

  const handleDuration = (dur: number) => {
    if (dur && Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
  };

  let fileDuration: string | null = null;
  if (isMediaFile) {
    fileDuration = isExternalUrl ? 'n/a' : formatDuration(duration);
  }
  const ariaLabel = `Select ${fileName}, ${fileTypeLabel}, ${fileSize}${fileDuration ? `, ${fileDuration}` : ''}${isSelected ? ', selected' : ''}`;

  return (
    <div
      key={`${file._id || file.filename || index}`}
      role="listitem"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onClick={() => onFileSelect(file)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFileSelect(file);
        }
      }}
      aria-label={ariaLabel}
      className={`border border-gray-100 rounded-lg flex flex-col gap-0 items-start justify-start cursor-pointer transition-colors 
                            overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 
                            focus-visible:ring-inset ${
                              isSelected
                                ? 'border-indigo-200 bg-indigo-50'
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
    >
      <div className="relative w-full h-48 overflow-hidden" aria-hidden="true">
        <FilePreview
          className="w-full h-full object-cover"
          file={file}
          onDuration={isMediaFile && !isExternalUrl && !file.duration ? handleDuration : undefined}
        />
      </div>
      <div className="p-4 flex flex-col gap-2 items-start justify-start w-full">
        <div className="text-gray-900 text-sm font-bold truncate w-full text-ellipsis whitespace-nowrap">
          {fileName}
        </div>
        <div className="flex flex-row gap-1 items-end justify-end w-full">
          <div className="flex flex-row gap-6 items-center justify-start flex-1">
            <div className="flex flex-col gap-0 items-start">
              <div className="text-gray-500 text-xs">
                <Translate>Type</Translate>
              </div>
              <div className="text-gray-800 text-sm font-medium truncate max-w-[100px]">
                {fileTypeLabel}
              </div>
            </div>
            <div className="flex flex-col gap-0 items-start">
              <div className="text-gray-500 text-xs">
                <Translate>Size</Translate>
              </div>
              <div className="text-gray-800 text-sm font-medium">{fileSize}</div>
            </div>
            {isMediaFile && (
              <div className="flex flex-col gap-0 items-start">
                <div className="text-gray-500 text-xs">
                  <Translate>Duration</Translate>
                </div>
                <div className="text-gray-800 text-sm font-medium">{fileDuration}</div>
              </div>
            )}
            {translations && translations.length > 0 && (
              <div className="flex flex-col gap-0 items-start">
                <div className="text-gray-500 text-xs">
                  <Translate>Translations</Translate>
                </div>
                <div className="text-gray-800 text-sm font-medium">
                  {translations.length}/{languages?.length}
                </div>
              </div>
            )}
          </div>
          <a
            href={downloadUrl}
            download={!file.url}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            aria-label={`Download ${fileName}`}
            className="text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset rounded"
          >
            <ArrowDownTrayIcon className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};

export { FileCard };

export type { EntityFile };
