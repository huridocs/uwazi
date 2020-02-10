import { UploadSchema } from 'api/upload/uploadType';
import language from 'shared/languagesList';

export default function getEntityDocument(
  documents: Array<UploadSchema>,
  entityLanguage: string,
  defaultLanguage: string
) {
  const documentMatchingEntity = documents.find(
    (document: UploadSchema) =>
      document.language && language(document.language, 'ISO639_1') === entityLanguage
  );

  const documentMatchingDefault = documents.find(
    (document: UploadSchema) =>
      document.language && language(document.language, 'ISO639_1') === defaultLanguage
  );

  return documentMatchingEntity || documentMatchingDefault || documents[0];
}
