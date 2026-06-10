import React, { useEffect, useMemo, useState } from 'react';
import {
  DocumentIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { InputField, Select } from '#V2/Components/Forms/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';
import { fileLanguageSelectOptions } from './fileLanguageOptions.js';
import { fileSupportsLanguage, isPdfFile } from './fileUploadHelpers.js';
import { useEntityFiles } from './EntityFilesContext.js';

type AddAs = 'supporting' | 'primary';

const getFileIcon = (file: File) => {
  const mime = file.type;

  if (mime.startsWith('audio/')) {
    return <MusicalNoteIcon className="h-5 w-5 shrink-0 text-ink-tertiary" />;
  }

  if (mime.startsWith('video/')) {
    return <VideoCameraIcon className="h-5 w-5 shrink-0 text-ink-tertiary" />;
  }

  if (mime.startsWith('image/')) {
    return <PhotoIcon className="h-5 w-5 shrink-0 text-ink-tertiary" />;
  }

  if (mime === 'application/pdf' || isPdfFile(file)) {
    return <DocumentTextIcon className="h-5 w-5 shrink-0 text-ink-tertiary" />;
  }

  return <DocumentIcon className="h-5 w-5 shrink-0 text-ink-tertiary" />;
};

const AddFileModal = () => {
  const { pendingAddFile, addFileMode, closeAddFileModal, confirmAddFile, defaultLanguageKey } =
    useEntityFiles();
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
        label: t('System', 'Primary document', null, false),
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
    if (!file) {
      return;
    }

    const { name } = getFileNameAndExtension(file.name);
    setDisplayName(name);
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
        <div className="flex items-center gap-2">
          <span className="flex shrink-0 items-center">{getFileIcon(file)}</span>
          <InputField
            id="add-file-name"
            label={<Translate>Name</Translate>}
            hideLabel
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            disabled={isSubmitting}
            className="min-w-0 flex-1 bg-paper"
          />
        </div>
        <div
          className={[
            'mt-3 grid gap-3',
            showLanguage && showAddAs ? 'grid-cols-2' : 'grid-cols-1',
          ].join(' ')}
        >
          {showLanguage ? (
            <Select
              id="add-file-language"
              label={<Translate>Language</Translate>}
              options={languageOptions}
              value={language}
              onChange={event => setLanguage(event.target.value)}
              disabled={isSubmitting}
              className="bg-paper"
            />
          ) : null}
          {showAddAs ? (
            <Select
              id="add-file-type"
              label={<Translate>Add as</Translate>}
              options={addAsOptions}
              value={addAs}
              onChange={event => setAddAs(event.target.value as AddAs)}
              disabled={isSubmitting}
              className="bg-paper"
            />
          ) : null}
          {!showAddAs ? (
            <div>
              <div className="mb-2 block text-sm font-medium text-ink-secondary">
                <Translate>Add as</Translate>
              </div>
              <div className="text-sm text-ink">
                <Translate>Primary document</Translate>
              </div>
            </div>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer>
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
