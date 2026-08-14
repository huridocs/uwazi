import React, { useMemo, useRef, useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { LinkIcon, MusicalNoteIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import type { ClientFile } from '#app/istore.js';
import { FileType } from '#shared/types/fileType.js';
import { validateAndSanitizeUrl } from '#shared/urlValidationUtils.js';
import { Button, DashedUploadDropzone, FileIcon, Modal, Tooltip } from '#V2/Components/UI/index.js';
import { formatBytes } from '#V2/shared/formatHelpers.js';
import {
  attachmentKey,
  extractMediaUrl,
  filterAttachments,
  getAttachmentSelectionValue,
  getFileInputAccept,
  type MediaPickerMode,
} from './mediaPickerAttachments.js';

type MediaPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string, localFile?: File) => void | Promise<void>;
  mode: MediaPickerMode;
  attachments: Array<FileType | ClientFile>;
  currentValue?: string;
};

const urlInputClass =
  'min-w-0 flex-1 rounded border border-border bg-paper px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink/20';

const AttachmentPreview = ({
  mode,
  filename,
  mimetype,
  url,
}: {
  mode: MediaPickerMode;
  filename: string;
  mimetype: string;
  url?: string;
}) => {
  if (mode === 'image') {
    return (
      <FileIcon filename={filename} mimetype={mimetype} altText="" className="h-full w-full" />
    );
  }

  const iconClass = 'h-8 w-8 text-ink-muted';
  if (url) return <LinkIcon className={iconClass} aria-hidden />;
  if (mimetype.includes('audio')) return <MusicalNoteIcon className={iconClass} aria-hidden />;
  return <VideoCameraIcon className={iconClass} aria-hidden />;
};

const MediaPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  mode,
  attachments,
  currentValue,
}: MediaPickerModalProps) => {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [selectError, setSelectError] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAttachments = useMemo(
    () => filterAttachments(attachments, mode),
    [attachments, mode]
  );

  const selectedUrl = extractMediaUrl(currentValue);
  const isImage = mode === 'image';
  const title = isImage ? 'Select image' : 'Select media';
  const urlAriaLabel = isImage ? 'Image URL' : 'Media URL';
  const fileAriaLabel = isImage ? 'Image file' : 'Media file';

  const resetState = () => {
    setUrlInput('');
    setUrlError(false);
    setSelectError(false);
    setSelecting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSelect = async (value: string, localFile?: File) => {
    setSelectError(false);
    setSelecting(true);
    try {
      await onSelect(value, localFile);
      handleClose();
    } catch {
      setSelectError(true);
    } finally {
      setSelecting(false);
    }
  };

  const pickLocalFile = (file: File | undefined) => {
    if (!file) return;
    handleSelect('', file).catch(() => undefined);
  };

  const handleLocalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    pickLocalFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleUrlSubmit = () => {
    const { url, isValid } = validateAndSanitizeUrl(urlInput.trim());

    if (!isValid) {
      setUrlError(true);
      return;
    }

    handleSelect(url).catch(() => undefined);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal size="xl" ariaLabel={title}>
      <Modal.Header>
        {isImage ? (
          <Translate className="text-md font-bold">Select image</Translate>
        ) : (
          <Translate className="text-md font-bold">Select media</Translate>
        )}
        <Modal.CloseButton onClick={handleClose} />
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <DashedUploadDropzone
          onPick={() => fileInputRef.current?.click()}
          onDropFile={pickLocalFile}
          disabled={selecting}
          title={
            isImage ? (
              <Translate>Click to select an image</Translate>
            ) : (
              <Translate>Click to select audio or video</Translate>
            )
          }
          subtitle={<Translate>or drag and drop here</Translate>}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={getFileInputAccept(mode)}
          aria-label={fileAriaLabel}
          className="sr-only"
          tabIndex={-1}
          disabled={selecting}
          onChange={handleLocalFileChange}
        />
        {selectError ? (
          <p className="text-sm text-seal">
            <Translate>Could not add media. Please try again.</Translate>
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
              <Translate>Or paste a URL</Translate>
            </span>
            <Tooltip
              content={
                isImage
                  ? t(
                      'System',
                      'Paste an image URL to use it as this property without uploading a file. Press Enter to apply.',
                      null,
                      false
                    )
                  : t(
                      'System',
                      'Paste an audio or video URL to use it as this property without uploading a file. Press Enter to apply.',
                      null,
                      false
                    )
              }
              placement="top"
              size="sm"
            >
              <QuestionMarkCircleIcon className="h-4 w-4 text-ink-muted" aria-hidden />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              disabled={selecting}
              aria-label={urlAriaLabel}
              onChange={event => {
                setUrlInput(event.target.value);
                setUrlError(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleUrlSubmit();
                }
              }}
              placeholder="https://"
              className={urlInputClass}
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 whitespace-nowrap"
              disabled={selecting}
              onClick={handleUrlSubmit}
            >
              <Translate>Use URL</Translate>
            </Button>
          </div>
        </div>
        {urlError ? (
          <p className="text-sm text-seal">
            <Translate>Invalid URL</Translate>
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>On this entity</Translate>
          </span>
          {filteredAttachments.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              {isImage ? (
                <Translate>No images on this entity</Translate>
              ) : (
                <Translate>No audio or video on this entity</Translate>
              )}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredAttachments.map(attachment => {
                const selectionValue = getAttachmentSelectionValue(attachment);
                const isSelected = selectionValue === selectedUrl;
                const filename = attachment.originalname || attachment.filename || '';

                return (
                  <li key={attachmentKey(attachment, selectionValue)}>
                    <button
                      type="button"
                      disabled={selecting}
                      className={[
                        'flex w-full flex-col overflow-hidden rounded-md border text-left',
                        isSelected ? 'border-border bg-parchment' : 'border-border/50 bg-paper',
                        selecting ? 'cursor-not-allowed opacity-60' : '',
                      ].join(' ')}
                      onClick={() => {
                        handleSelect(selectionValue).catch(() => undefined);
                      }}
                    >
                      <div className="border-b border-border/50 px-2 py-1">
                        <span className="block truncate text-xs font-medium">{filename}</span>
                        {attachment.size ? (
                          <span className="text-xs text-ink-secondary">
                            {formatBytes(attachment.size)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex h-24 items-center justify-center p-2">
                        <AttachmentPreview
                          mode={mode}
                          filename={attachment.filename || attachment.originalname || ''}
                          mimetype={attachment.mimetype || ''}
                          url={attachment.url}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-3 px-6! py-4!">
        <Button type="button" variant="secondary" onClick={handleClose}>
          <Translate>Cancel</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { MediaPickerModal };
export type { MediaPickerMode, MediaPickerModalProps };
