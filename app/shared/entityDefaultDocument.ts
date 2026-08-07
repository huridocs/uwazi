import { FileType } from '#shared/types/fileType.js';
import { LanguageUtils } from '#shared/language/index.js';

const isDocumentReady = (document: FileType) =>
  document.status === undefined || document.status === 'ready';

const readyDocuments = <T extends FileType>(entityDocuments: Array<T> | undefined): T[] =>
  (entityDocuments || []).filter(isDocumentReady);

const entityDefaultDocument = (
  entityDocuments: Array<FileType>,
  entityLanguage: string,
  defaultLanguage: string
) => {
  const documents = readyDocuments(entityDocuments);
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

export { entityDefaultDocument, readyDocuments, isDocumentReady };
