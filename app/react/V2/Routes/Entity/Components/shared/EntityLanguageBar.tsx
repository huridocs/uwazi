import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { formatLanguageName } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { DirtyDiscardModal, LanguageSelect } from '#V2/Components/UI/index.js';
import {
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isEditing, isDirty, isSaving, cancelEdit } = useMetadataEditing();
  const uiLocale = useAtomValue(localeAtom) || 'en';
  const [pendingLanguage, setPendingLanguage] = useState<string>();

  const languageOptions = useMemo(
    () =>
      languages
        .map(lang => ({
          value: lang.key,
          label: formatLanguageName(lang.key, uiLocale),
          iso6391: lang.key,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, uiLocale)),
    [languages, uiLocale]
  );

  if (languages.length < 2) {
    return null;
  }

  const requestLanguage = (nextLanguage: string) => {
    if (nextLanguage === language || isSaving) {
      return;
    }
    if (isEditing && isDirty) {
      setPendingLanguage(nextLanguage);
      return;
    }
    if (isEditing) {
      cancelEdit();
    }
    setLanguage(nextLanguage).catch(() => undefined);
  };

  const discardAndSwitch = () => {
    const nextLanguage = pendingLanguage;
    setPendingLanguage(undefined);
    if (!nextLanguage || isSaving) {
      return;
    }
    cancelEdit();
    setLanguage(nextLanguage).catch(() => undefined);
  };

  return (
    <>
      <LanguageSelect
        value={language}
        options={languageOptions}
        onChange={requestLanguage}
        disabled={isLoading || isSaving}
        aria-label="Language"
        listAriaLabel="Language selection"
        align="end"
        appearance="default"
      />
      {pendingLanguage ? (
        <DirtyDiscardModal
          action="switch"
          onDiscard={discardAndSwitch}
          onCancel={() => setPendingLanguage(undefined)}
        />
      ) : null}
    </>
  );
};

export { EntityLanguageBar };
