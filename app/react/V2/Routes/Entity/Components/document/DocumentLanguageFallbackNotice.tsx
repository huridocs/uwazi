import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { formatLanguageLabelFromCode, LanguageUtils } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';

type DocumentLanguageFallbackNoticeProps = {
  document: FileType;
};

const DocumentLanguageFallbackNotice = ({ document }: DocumentLanguageFallbackNoticeProps) => {
  const { language } = useEntityLanguage();
  const uiLocale = useAtomValue(localeAtom) || 'en';
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
      <Translate>No translation in</Translate> {formatLanguageLabelFromCode(language, uiLocale)}.{' '}
      <Translate>Showing</Translate> {formatLanguageLabelFromCode(document.language, uiLocale)}.
    </div>
  );
};

export { DocumentLanguageFallbackNotice };
