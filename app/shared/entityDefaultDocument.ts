import { FileType } from '#shared/types/fileType.js';
import { LanguageUtils } from '#shared/language/index.js';

export const entityDefaultDocument = (
  entityDocuments: Array<FileType>,
  entityLanguage: string,
  defaultLanguage: string
) => {
  const documents = entityDocuments || [];
  const documentMatchingEntity = documents.find(
    (document: FileType) =>
      document.language &&
      LanguageUtils.fromISO639_3(document.language)?.ISO639_1 === entityLanguage
  );

  const documentMatchingDefault = documents.find(
    (document: FileType) =>
      document.language &&
      LanguageUtils.fromISO639_3(document.language)?.ISO639_1 === defaultLanguage
  );

  return documentMatchingEntity || documentMatchingDefault || documents[0];
};
