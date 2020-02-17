import { FileSchema } from 'shared/types/fileType';
import language from 'shared/languagesList';

export const entityDefaultDocument = (
  documents: Array<FileSchema>,
  entityLanguage: string,
  defaultLanguage: string
) => {
  const documentMatchingEntity = documents.find(
    (document: FileSchema) =>
      document.language && language(document.language, 'ISO639_1') === entityLanguage
  );

  const documentMatchingDefault = documents.find(
    (document: FileSchema) =>
      document.language && language(document.language, 'ISO639_1') === defaultLanguage
  );

  return documentMatchingEntity || documentMatchingDefault || documents[0];
};
