import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { formatLanguageName } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { LanguageSelect } from '#V2/Components/UI/index.js';
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

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isSaving } = useMetadataEditing();
  const uiLocale = useAtomValue(localeAtom) || 'en';
  const languageOptions = useMemo(
    () => languageSelectOptions(languages, uiLocale),
    [languages, uiLocale]
  );
  if (languages.length < 2) return null;

  return (
    <LanguageSelect
      value={language}
      options={languageOptions}
      onChange={nextLanguage => {
        if (nextLanguage === language || isSaving) return;
        setLanguage(nextLanguage).catch(() => undefined);
      }}
      disabled={isLoading || isSaving}
      aria-label="Language"
      align="end"
      appearance="default"
    />
  );
};

export { EntityLanguageBar };
