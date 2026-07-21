import React, { useMemo, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientFile } from '#app/istore.js';
import { FileType } from '#shared/types/fileType.js';
import { validateAndSanitizeUrl } from '#shared/urlValidationUtils.js';
import { Button, FileIcon, Modal } from '#V2/Components/UI/index.js';
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

  const handleLocalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleSelect('', file).catch(() => undefined);
    const { target } = event;
    target.value = '';
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
    <Modal size="xl" ariaLabel="Media picker">
      <Modal.Header>
        <Translate>Supporting files</Translate>
        <Modal.CloseButton onClick={handleClose} />
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              <Translate>From computer</Translate>
            </h3>
            <div>
              <Button
                type="button"
                variant="secondary"
                data-testid="media-picker-select-file"
                disabled={selecting}
                onClick={() => fileInputRef.current?.click()}
              >
                <Translate>Select from computer</Translate>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={getFileInputAccept(mode)}
                className="sr-only"
                data-testid="media-picker-file-input"
                disabled={selecting}
                onChange={handleLocalFileChange}
              />
              {selectError ? (
                <p className="mt-2 text-sm text-(--color-theme-control-text-error)">
                  <Translate>Could not add media. Please try again.</Translate>
                </p>
              ) : null}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              <Translate>Paste URL</Translate>
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <input
                type="url"
                value={urlInput}
                disabled={selecting}
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
                className="block w-full rounded-lg border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-2.5 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                data-testid="media-picker-use-url"
                disabled={selecting}
                onClick={handleUrlSubmit}
              >
                <Translate>Use URL</Translate>
              </Button>
            </div>
            {urlError ? (
              <p className="text-sm text-(--color-theme-control-text-error)">
                <Translate>Invalid URL</Translate>
              </p>
            ) : null}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              <Translate>From files</Translate>
            </h3>
            {filteredAttachments.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                <Translate>No attachments</Translate>
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredAttachments.map(attachment => {
                  const selectionValue = getAttachmentSelectionValue(attachment);
                  const isSelected = selectionValue === selectedUrl;

                  return (
                    <li key={attachmentKey(attachment, selectionValue)}>
                      <button
                        type="button"
                        disabled={selecting}
                        data-testid={`media-picker-attachment-${attachment._id || attachment.filename || selectionValue}`}
                        className={[
                          'flex w-full flex-col overflow-hidden rounded-md border text-left',
                          isSelected
                            ? 'border-(--color-theme-control-border-active) bg-(--color-theme-surface-warm)'
                            : 'border-(--color-theme-control-border) bg-(--color-theme-control-bg)',
                          selecting ? 'cursor-not-allowed opacity-60' : '',
                        ].join(' ')}
                        onClick={() => {
                          handleSelect(selectionValue).catch(() => undefined);
                        }}
                      >
                        <div className="border-b border-(--color-theme-control-border) px-2 py-1">
                          <span className="block truncate text-xs font-medium">
                            {attachment.originalname || attachment.filename}
                          </span>
                          {attachment.size ? (
                            <span className="text-xs text-ink-secondary">
                              {formatBytes(attachment.size)}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex h-24 items-center justify-center p-2">
                          <FileIcon
                            filename={attachment.filename || attachment.originalname || ''}
                            mimetype={attachment.mimetype || ''}
                            altText={attachment.originalname}
                            className="h-full w-full"
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={handleClose}>
          <Translate>Cancel</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { MediaPickerModal };
export type { MediaPickerMode, MediaPickerModalProps };
