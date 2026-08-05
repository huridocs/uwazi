import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';

const toDisplayCode = (code: string) => {
  const fromIso3 = LanguageUtils.fromISO639_3(code, false);
  if (fromIso3) return fromIso3.ISO639_1.toUpperCase();
  const fromIso1 = LanguageUtils.fromISO639_1(code);
  return fromIso1?.ISO639_1.toUpperCase() ?? code.toUpperCase();
};

type DocumentLanguageFallbackNoticeProps = {
  document: FileType;
};

const DocumentLanguageFallbackNotice = ({ document }: DocumentLanguageFallbackNoticeProps) => {
  const { language } = useEntityLanguage();
  const selectedIso3 = LanguageUtils.fromISO639_1(language)?.ISO639_3;
  if (!selectedIso3 || !document.language || document.language === selectedIso3) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-warning-light px-3 py-1.5 text-xs font-medium text-warning shadow-sm"
      role="status"
      data-testid="document-language-fallback"
    >
      <Translate>No translation in</Translate> {toDisplayCode(language)}.{' '}
      <Translate>Showing</Translate> {toDisplayCode(document.language)}.
    </div>
  );
};

export { DocumentLanguageFallbackNotice };
