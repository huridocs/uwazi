import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  DocumentIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';
import { fileLanguageSelectOptions, fileSupportsLanguage, isPdfFile } from './fileHelpers.js';
import { FileUploadProgressLine } from './FileUploadProgressLine.js';
import { useEntityFiles } from './EntityFilesContext.js';

type AddAs = 'supporting' | 'primary';

const fieldLabelClass = 'text-nano font-medium uppercase tracking-wide text-ink-muted';
const controlClass =
  'w-full appearance-none rounded border border-border bg-paper py-1 pl-2 pr-7 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink/20 disabled:opacity-70';

const getFileIcon = (file: File) => {
  const mime = file.type;
  const iconClass = 'h-4 w-4 shrink-0 text-ink-muted';

  if (mime.startsWith('audio/')) return <MusicalNoteIcon className={iconClass} />;
  if (mime.startsWith('video/')) return <VideoCameraIcon className={iconClass} />;
  if (mime.startsWith('image/')) return <PhotoIcon className={iconClass} />;
  if (mime === 'application/pdf' || isPdfFile(file)) {
    return <DocumentTextIcon className={iconClass} />;
  }
  return <DocumentIcon className={iconClass} />;
};

const AddFileModal = () => {
  const {
    pendingAddFile,
    addFileMode,
    closeAddFileModal,
    confirmAddFile,
    defaultLanguageKey,
    uploadProgress,
  } = useEntityFiles();
  const [displayName, setDisplayName] = useState('');
  const [addAs, setAddAs] = useState<AddAs>('supporting');
  const [language, setLanguage] = useState('eng');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const file = pendingAddFile;
  const isPdf = file ? isPdfFile(file) : false;
  const showLanguage = file ? fileSupportsLanguage(file) : false;
  const showAddAs = addFileMode === 'main';
  const resolvedAddAs: AddAs = addFileMode === 'translation' ? 'primary' : addAs;

  const languageOptions = useMemo(() => fileLanguageSelectOptions(), []);
  const addAsOptions = useMemo(
    () => [
      { value: 'supporting', label: t('System', 'Supporting file', null, false) },
      {
        value: 'primary',
        label: t('System', 'New primary doc', null, false),
        disabled: !isPdf,
      },
    ],
    [isPdf]
  );

  const defaultLanguageIso = useMemo(() => {
    const fromKey = defaultLanguageKey
      ? LanguageUtils.fromISO639_1(defaultLanguageKey)?.ISO639_3
      : undefined;
    return fromKey ?? 'eng';
  }, [defaultLanguageKey]);

  useEffect(() => {
    if (!file) return;
    setDisplayName(getFileNameAndExtension(file.name).name);
    setAddAs('supporting');
    setLanguage(defaultLanguageIso);
    setIsSubmitting(false);
  }, [defaultLanguageIso, file]);

  if (!file || !addFileMode) {
    return null;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await confirmAddFile({
        file,
        displayName: displayName.trim() || getFileNameAndExtension(file.name).name,
        addAs: resolvedAddAs,
        language: showLanguage ? language : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Add file</Translate>
        <Modal.CloseButton onClick={closeAddFileModal} disabled={isSubmitting} />
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <div className="rounded-md border border-border/50 bg-warm p-3">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-1 flex shrink-0 items-center">{getFileIcon(file)}</span>
              <input
                id="add-file-name"
                type="text"
                aria-label={t('System', 'Name', null, false)}
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                disabled={isSubmitting}
                className="min-w-0 flex-1 rounded border border-border bg-paper px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-carbon/30 disabled:opacity-70"
              />
              <button
                type="button"
                onClick={closeAddFileModal}
                disabled={isSubmitting}
                className="shrink-0 cursor-pointer pt-1 text-xs text-ink-tertiary transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Translate>Remove</Translate>
              </button>
            </div>

            <div
              className={[
                'grid gap-3',
                showLanguage && showAddAs ? 'grid-cols-2' : 'grid-cols-1',
              ].join(' ')}
            >
              {showLanguage ? (
                <label className="space-y-1" htmlFor="add-file-language">
                  <span className={fieldLabelClass}>
                    <Translate>Language</Translate>
                  </span>
                  <div className="relative">
                    <select
                      id="add-file-language"
                      value={language}
                      onChange={event => setLanguage(event.target.value)}
                      disabled={isSubmitting}
                      className={controlClass}
                    >
                      {languageOptions.map(option => (
                        <option key={option.key ?? option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-tertiary" />
                  </div>
                </label>
              ) : null}
              {showAddAs ? (
                <label className="space-y-1" htmlFor="add-file-type">
                  <span className={fieldLabelClass}>
                    <Translate>Add as</Translate>
                  </span>
                  <div className="relative">
                    <select
                      id="add-file-type"
                      value={addAs}
                      onChange={event => setAddAs(event.target.value as AddAs)}
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
              {!showAddAs ? (
                <div className="space-y-1">
                  <span className={fieldLabelClass}>
                    <Translate>Add as</Translate>
                  </span>
                  <div className="text-xs text-ink">
                    <Translate>Primary document</Translate>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {isSubmitting ? (
            <div className="mt-2">
              <FileUploadProgressLine progress={uploadProgress ?? 0} />
            </div>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-3 px-6! py-4!">
        <Button variant="secondary" onClick={closeAddFileModal} disabled={isSubmitting}>
          <Translate>Cancel</Translate>
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
          <Translate>Add file</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { AddFileModal };
