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

const getFileCardModel = (file: EntityFile, duration: number | undefined) => {
  const fileUrl = file.url || (file.filename ? `/api/files/${file.filename}` : '');
  const isMediaFile = file.fileType === 'media' || /^(audio|video)\//.test(file.mimetype || '');
  const isExternalUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
  const fileName = file.originalname || file.url || 'Untitled';
  const fileTypeLabel = getFileTypeLabel(file);
  const fileSize = file.size ? formatBytes(file.size) : 'n/a';
  let fileDuration: string | null = null;
  if (isMediaFile) {
    fileDuration = isExternalUrl ? 'n/a' : formatDuration(duration);
  }
  return {
    fileUrl,
    downloadUrl: file.filename ? `${fileUrl}?download=true` : fileUrl,
    isMediaFile,
    isExternalUrl,
    fileName,
    fileTypeLabel,
    fileSize,
    fileDuration,
    ariaLabel: `Select ${fileName}, ${fileTypeLabel}, ${fileSize}${fileDuration ? `, ${fileDuration}` : ''}`,
  };
};

const FileCard = ({ file, index, onFileSelect = () => {}, translations = [] }: FileCardProps) => {
  const [duration, setDuration] = useState<number | undefined>(file.duration);
  const { languages } = useAtomValue(settingsAtom);
  const card = getFileCardModel(file, duration);

  return (
    <div
      key={`${file._id || file.filename || index}`}
      role="listitem"
      className="relative overflow-hidden rounded-lg border border-border bg-paper"
    >
      <button
        type="button"
        aria-label={card.ariaLabel}
        onClick={() => onFileSelect(file)}
        className="flex w-full cursor-pointer flex-col items-start justify-start gap-0 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-inset"
      >
        <div className="relative h-48 w-full overflow-hidden" aria-hidden="true">
          <FilePreview
            className="h-full w-full object-cover"
            file={file}
            onDuration={
              card.isMediaFile && !card.isExternalUrl && !file.duration
                ? dur => {
                    if (dur && Number.isFinite(dur) && dur > 0) {
                      setDuration(dur);
                    }
                  }
                : undefined
            }
          />
        </div>
        <div className="flex w-full flex-col items-start justify-start gap-2 p-4 pr-12">
          <div className="w-full truncate text-ellipsis whitespace-nowrap text-sm font-bold text-ink">
            {card.fileName}
          </div>
          <div className="flex w-full flex-1 flex-row items-center justify-start gap-6">
            <div className="flex flex-col items-start gap-0">
              <div className="text-xs text-ink-muted">
                <Translate>Type</Translate>
              </div>
              <div className="max-w-25 truncate text-sm font-medium text-ink">
                {card.fileTypeLabel}
              </div>
            </div>
            <div className="flex flex-col items-start gap-0">
              <div className="text-xs text-ink-muted">
                <Translate>Size</Translate>
              </div>
              <div className="text-sm font-medium text-ink">{card.fileSize}</div>
            </div>
            {card.isMediaFile && (
              <div className="flex flex-col items-start gap-0">
                <div className="text-xs text-ink-muted">
                  <Translate>Duration</Translate>
                </div>
                <div className="text-sm font-medium text-ink">{card.fileDuration}</div>
              </div>
            )}
            {translations.length > 0 && (
              <div className="flex flex-col items-start gap-0">
                <div className="text-xs text-ink-muted">
                  <Translate>Translations</Translate>
                </div>
                <div className="text-sm font-medium text-ink">
                  {translations.length}/{languages?.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </button>
      <a
        href={card.downloadUrl}
        download={!file.url}
        aria-label={`Download ${card.fileName}`}
        className="absolute right-4 bottom-4 z-10 rounded text-ink-secondary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-inset"
      >
        <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
      </a>
    </div>
  );
};

export { FileCard };

export type { EntityFile };
