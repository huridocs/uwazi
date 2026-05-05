import { Entity } from '#app/V2/api/entities/types.js';
import { LanguageUtils } from '#shared/language/index.js';

const getMainDocument = (documents: Entity['documents'], locale: string) => {
  if (!documents?.length) {
    return undefined;
  }

  if (documents.length === 1) {
    return documents[0];
  }

  const isoCode = LanguageUtils.fromISO639_1(locale)?.ISO639_3;
  return documents.find(document => document.language === isoCode) || documents[0];
};

export { getMainDocument };
