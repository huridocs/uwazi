import React from 'react';

export type PageEditorLanguage = {
  key: string;
  label?: string;
  default?: boolean;
};

type Props = {
  languages: PageEditorLanguage[];
  activeLanguage: string;
  onChange: (key: string) => void;
};

const pillClass = (active: boolean) =>
  [
    'px-3 py-1 text-xs font-semibold uppercase rounded-md transition-colors',
    active ? 'bg-vellum text-ink' : 'bg-warm text-ink-tertiary hover:text-ink-secondary',
  ].join(' ');

const PageEditorLanguageSelector = ({ languages, activeLanguage, onChange }: Props) => {
  if (languages.length === 0) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-end gap-1"
      data-testid="page-editor-language-selector"
    >
      {languages.map(lang => (
        <button
          key={lang.key}
          type="button"
          className={pillClass(lang.key === activeLanguage)}
          onClick={() => onChange(lang.key)}
          aria-pressed={lang.key === activeLanguage}
        >
          {lang.key.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export { PageEditorLanguageSelector };
