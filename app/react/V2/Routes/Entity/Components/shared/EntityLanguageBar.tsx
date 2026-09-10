import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { formatLanguageName } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { DirtyDiscardModal, LanguageSelect } from '#V2/Components/UI/index.js';
import {
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';

type LanguageOption = { value: string; label: string; iso6391: string };

const languageSelectOptions = (languages: { key: string }[], uiLocale: string): LanguageOption[] =>
  languages
    .map(lang => ({
      value: lang.key,
      label: formatLanguageName(lang.key, uiLocale),
      iso6391: lang.key,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, uiLocale));

const applyLanguage = (setLanguage: (key: string) => Promise<unknown>, nextLanguage: string) => {
  setLanguage(nextLanguage).catch(() => undefined);
};

type LanguageSwitchState = {
  language: string;
  isSaving: boolean;
  isEditing: boolean;
  isDirty: boolean;
  cancelEdit: () => void;
  setLanguage: (key: string) => Promise<unknown>;
  setPendingLanguage: (key: string | undefined) => void;
};

const requestLanguage = (state: LanguageSwitchState, nextLanguage: string) => {
  if (nextLanguage === state.language || state.isSaving) return;
  if (state.isEditing && state.isDirty) {
    state.setPendingLanguage(nextLanguage);
    return;
  }
  if (state.isEditing) state.cancelEdit();
  applyLanguage(state.setLanguage, nextLanguage);
};

const discardPendingLanguage = ({
  pendingLanguage,
  isSaving,
  cancelEdit,
  setLanguage,
  setPendingLanguage,
}: LanguageSwitchState & { pendingLanguage?: string }) => {
  setPendingLanguage(undefined);
  if (!pendingLanguage || isSaving) return;
  cancelEdit();
  applyLanguage(setLanguage, pendingLanguage);
};

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isEditing, isDirty, isSaving, cancelEdit } = useMetadataEditing();
  const uiLocale = useAtomValue(localeAtom) || 'en';
  const [pendingLanguage, setPendingLanguage] = useState<string>();
  const languageOptions = useMemo(
    () => languageSelectOptions(languages, uiLocale),
    [languages, uiLocale]
  );
  if (languages.length < 2) return null;

  const switchState: LanguageSwitchState = {
    language,
    isSaving,
    isEditing,
    isDirty,
    cancelEdit,
    setLanguage,
    setPendingLanguage,
  };

  return (
    <>
      <LanguageSelect
        value={language}
        options={languageOptions}
        onChange={nextLanguage => requestLanguage(switchState, nextLanguage)}
        disabled={isLoading || isSaving}
        aria-label="Language"
        align="end"
        appearance="default"
      />
      {pendingLanguage ? (
        <DirtyDiscardModal
          onDiscard={() => discardPendingLanguage({ ...switchState, pendingLanguage })}
          onCancel={() => setPendingLanguage(undefined)}
        />
      ) : null}
    </>
  );
};

export { EntityLanguageBar };
