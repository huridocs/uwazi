// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';

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
