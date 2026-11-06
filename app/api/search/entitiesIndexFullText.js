import { entityDefaultDocument } from '#shared/entityDefaultDocument.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';

const attachDefaultDocumentsFullText = async entities => {
  const filesDAO = FilesDAOFactory.default({ accessContext: AccessContext.system() });

  const defaultDocumentIds = [];
  entities.forEach(entity => {
    const defaultDocument = entityDefaultDocument(entity.documents, entity.language, 'en');
    if (defaultDocument?._id) {
      defaultDocumentIds.push(defaultDocument._id);
    }
  });

  if (defaultDocumentIds.length === 0) {
    return entities;
  }

  const fullTextFiles = await filesDAO.getByQuery(
    { _id: { $in: defaultDocumentIds } },
    { withFullText: true }
  );

  const fullTextById = new Map(fullTextFiles.map(file => [String(file._id), file.fullText]));

  entities.forEach(entity => {
    const defaultDocument = entityDefaultDocument(entity.documents, entity.language, 'en');
    if (defaultDocument?._id) {
      defaultDocument.fullText = fullTextById.get(String(defaultDocument._id));
    }
  });

  return entities;
};

export { attachDefaultDocumentsFullText };
