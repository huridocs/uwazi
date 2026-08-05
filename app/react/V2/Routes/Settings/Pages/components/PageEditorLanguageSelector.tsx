import React from 'react';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl/index.js';
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
  if (languages.length === 0) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-end"
      data-testid="page-editor-language-selector"
    >
      <SegmentedControl
        value={activeLanguage}
        onChange={onChange}
        ariaLabel="Page language"
        showLabels
        options={languages.map(lang => ({
          id: lang.key,
          title: lang.label ?? lang.key,
          label: lang.key.toUpperCase(),
        }))}
      />
    </div>
  );
};

export { PageEditorLanguageSelector };
