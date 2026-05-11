import { Entity } from '#app/V2/api/entities/types.js';
import { LanguageUtils } from '#shared/language/index.js';

const getMainDocument = (
  documents: Entity['documents'],
  locale: string,
  defaultLanguage?: string
) => {
  if (!documents?.length) {
    return undefined;
  }

  if (documents.length === 1) {
    return documents[0];
  }

  const isoCode = LanguageUtils.fromISO639_1(locale)?.ISO639_3;
  const defaultIsoCode = defaultLanguage
    ? LanguageUtils.fromISO639_1(defaultLanguage)?.ISO639_3
    : undefined;

  return (
    documents.find(document => document.language === isoCode) ||
    documents.find(document => document.language === defaultIsoCode) ||
    documents[0]
  );
};

export { getMainDocument };
