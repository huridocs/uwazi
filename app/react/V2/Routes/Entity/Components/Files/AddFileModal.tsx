import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';
import { AddFileDropzone } from './AddFileDropzone.js';
import { fileFieldLabelClass } from './FileDetailsField.js';
import { fileQueueKey, fileSupportsLanguage, isPdfFile } from './fileHelpers.js';
import { getBrowserFileIcon } from './fileRowIcon.js';
import { FileUploadProgressLine } from './FileUploadProgressLine.js';
import { useEntityFiles } from './EntityFilesContext.js';

type AddAs = 'supporting' | 'primary';

type QueuedAddFile = {
  file: File;
  displayName: string;
};

const isAddAs = (value: string): value is AddAs => value === 'supporting' || value === 'primary';

const controlClass =
  'w-full appearance-none rounded border border-border bg-paper py-1 pl-2 pr-7 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink/20 disabled:opacity-70';

const useAddFileDraft = (
  pendingAddFiles: File[],
  addFileMode: 'main' | 'translation',
  defaultLanguageKey: string | undefined
) => {
  const [queue, setQueue] = useState<QueuedAddFile[]>([]);
  const [addAs, setAddAs] = useState<AddAs>('supporting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allPdf = queue.length > 0 && queue.every(item => isPdfFile(item.file));
  const addAsOptions = useMemo(
    () => [
      { value: 'supporting', label: t('System', 'Supporting file', null, false) },
      {
        value: 'primary',
        label: t('System', 'New primary doc', null, false),
        disabled: !allPdf,
      },
    ],
    [allPdf]
  );
  const defaultLanguageIso = useMemo(() => {
    const fromKey = defaultLanguageKey
      ? LanguageUtils.fromISO639_1(defaultLanguageKey)?.ISO639_3
      : undefined;
    return fromKey ?? 'eng';
  }, [defaultLanguageKey]);

  useEffect(() => {
    setQueue(current => {
      const named = new Map(current.map(item => [fileQueueKey(item.file), item]));
      return pendingAddFiles.map(file => {
        const existing = named.get(fileQueueKey(file));
        return existing ?? { file, displayName: getFileNameAndExtension(file.name).name };
      });
    });
    if (pendingAddFiles.length === 0) {
      setAddAs('supporting');
      setIsSubmitting(false);
    }
  }, [pendingAddFiles]);

  const resolvedAddAs: AddAs = addFileMode === 'translation' ? 'primary' : addAs;
  return {
    queue,
    setQueue,
    addAs,
    setAddAs,
    isSubmitting,
    setIsSubmitting,
    showAddAs: addFileMode === 'main',
    resolvedAddAs,
    addAsOptions,
    defaultLanguageIso,
  };
};

const AddFileModal = () => {
  const {
    pendingAddFiles,
    addFileMode,
    closeAddFileModal,
    confirmAddFile,
    openAddFilePicker,
    acceptSelectedFiles,
    removePendingAddFile,
    defaultLanguageKey,
    uploadProgress,
  } = useEntityFiles();
  const {
    queue,
    setQueue,
    addAs,
    setAddAs,
    isSubmitting,
    setIsSubmitting,
    showAddAs,
    resolvedAddAs,
    addAsOptions,
    defaultLanguageIso,
  } = useAddFileDraft(pendingAddFiles, addFileMode ?? 'main', defaultLanguageKey);

  if (!addFileMode) {
    return null;
  }

  const handleConfirm = async () => {
    if (queue.length === 0) return;
    setIsSubmitting(true);
    try {
      await confirmAddFile(
        queue.map(item => ({
          file: item.file,
          displayName: item.displayName.trim() || getFileNameAndExtension(item.file.name).name,
          addAs: resolvedAddAs === 'primary' && isPdfFile(item.file) ? 'primary' : 'supporting',
          language: fileSupportsLanguage(item.file) ? defaultLanguageIso : undefined,
        }))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate className="text-md font-bold">Add file</Translate>
        <Modal.CloseButton onClick={closeAddFileModal} disabled={isSubmitting} />
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <AddFileDropzone
          queued={queue.length > 0}
          disabled={isSubmitting}
          onPick={openAddFilePicker}
          onDropFiles={acceptSelectedFiles}
        />
        {queue.length > 0 ? (
          <div className="space-y-2.5">
            {queue.map((item, index) => (
              <div
                key={fileQueueKey(item.file)}
                className="rounded-md border border-border/50 bg-warm p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1 flex shrink-0 items-center">
                    {getBrowserFileIcon(item.file)}
                  </span>
                  <input
                    type="text"
                    aria-label={t('System', 'Name', null, false)}
                    value={item.displayName}
                    onChange={event => {
                      const { value } = event.target;
                      setQueue(current =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, displayName: value } : entry
                        )
                      );
                    }}
                    disabled={isSubmitting}
                    className="min-w-0 flex-1 rounded border border-border bg-paper px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-carbon/30 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingAddFile(item.file)}
                    disabled={isSubmitting}
                    className="shrink-0 cursor-pointer pt-1 text-xs text-ink-tertiary transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Translate>Remove</Translate>
                  </button>
                </div>
              </div>
            ))}

            {showAddAs ? (
              <label className="space-y-1" htmlFor="add-file-type">
                <span className={fileFieldLabelClass}>
                  <Translate>Add as</Translate>
                </span>
                <div className="relative">
                  <select
                    id="add-file-type"
                    value={addAs}
                    onChange={event => {
                      const next = event.target.value;
                      if (isAddAs(next)) setAddAs(next);
                    }}
                    disabled={isSubmitting}
                    className={`${controlClass} truncate`}
                  >
                    {addAsOptions.map(option => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-tertiary" />
                </div>
              </label>
            ) : null}
            {isSubmitting ? <FileUploadProgressLine progress={uploadProgress ?? 0} /> : null}
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-3 px-6! py-4!">
        <Button variant="secondary" onClick={closeAddFileModal} disabled={isSubmitting}>
          <Translate>Cancel</Translate>
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={isSubmitting || queue.length === 0}
        >
          <Translate>Add file</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { AddFileModal };
