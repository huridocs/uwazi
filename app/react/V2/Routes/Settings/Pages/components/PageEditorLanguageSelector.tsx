import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { formatLanguageName } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { LanguageSelect } from '#V2/Components/UI/index.js';
import type { PageEditorLanguage } from '../pageEditorForm.js';

type PageEditorLanguageSelectorProps = {
  languages: PageEditorLanguage[];
  activeLanguage: string;
  onChange: (key: string) => void;
};

const PageEditorLanguageSelector = ({
  languages,
  activeLanguage,
  onChange,
}: PageEditorLanguageSelectorProps) => {
  const uiLocale = useAtomValue(localeAtom) || 'en';

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

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-end"
      data-testid="page-editor-language-selector"
    >
      <LanguageSelect
        value={activeLanguage}
        options={languageOptions}
        onChange={onChange}
        aria-label="Page language"
        align="end"
        appearance="default"
      />
    </div>
  );
};

export { PageEditorLanguageSelector };
