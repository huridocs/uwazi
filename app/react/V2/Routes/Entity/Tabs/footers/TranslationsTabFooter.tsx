import React from 'react';
import { AddTranslationButton } from '../../Components/Files/AddTranslationButton.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const TranslationsTabFooter = () => {
  const { focusedRow } = useEntityFiles();

  if (!focusedRow) {
    return <EntityTabFooter inset="side" />;
  }

  return (
    <EntityTabFooter inset="side">
      <AddTranslationButton className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border-soft bg-warm px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-ink/20 hover:bg-parchment hover:text-ink" />
    </EntityTabFooter>
  );
};

export { TranslationsTabFooter };
