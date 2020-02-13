import { FileSchema } from 'api/files/fileType';
import language from 'shared/languagesList';

export default function getEntityDocument(
  documents: Array<FileSchema>,
  entityLanguage: string,
  defaultLanguage: string
) {
  const documentMatchingEntity = documents.find(
    (document: FileSchema) =>
      document.language && language(document.language, 'ISO639_1') === entityLanguage
  );

  const documentMatchingDefault = documents.find(
    (document: FileSchema) =>
      document.language && language(document.language, 'ISO639_1') === defaultLanguage
  );

  return documentMatchingEntity || documentMatchingDefault || documents[0];
}
