/* eslint-disable max-lines */
import { WithId } from 'api/odm';
import {
  attachmentsPath,
  uploadsPath,
  files as filesAPI,
  generateFileName,
  storeFile,
} from 'api/files';
import { search } from 'api/search';
import { errorLog } from 'api/log';
import entities from 'api/entities/entities';
import { prettifyError } from 'api/utils/handleError';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { processDocument } from 'api/files/processDocument';
import { set } from 'lodash';

type FileAttachments = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding?: string;
};

async function prepareNewFiles(
  entity: EntityWithFilesSchema,
  updatedEntity: EntityWithFilesSchema,
  fileAttachments: FileType[] = [],
  documentAttachments: FileType[] = []
) {
  const attachments: FileType[] = [];
  const documents: FileType[] = [];
  const newUrls = entity.attachments?.filter(attachment => !attachment._id && attachment.url);

  if (fileAttachments.length) {
    await Promise.all(
      fileAttachments.map(async (file: FileType) => {
        const savedFile = await storeFile(attachmentsPath, file, true);
        attachments.push({
          ...savedFile,
          entity: updatedEntity.sharedId,
          type: 'attachment',
        });
      })
    );
  }

  if (newUrls && newUrls.length) {
    newUrls.map(async (url: any) => {
      attachments.push({
        ...url,
        entity: updatedEntity.sharedId,
        type: 'attachment',
      });
    });
  }

  if (documentAttachments.length) {
    await Promise.all(
      documentAttachments.map(async (document: FileType) => {
        const savedDocument = await storeFile(uploadsPath, document, true);
        documents.push({
          ...savedDocument,
          entity: updatedEntity.sharedId,
          type: 'document',
        });
      })
    );
  }

  return { attachments, documents };
}

const updateDeletedFiles = async (
  entityFiles: WithId<FileType>[],
  entity: EntityWithFilesSchema,
  type: 'attachment' | 'document'
) => {
  const deletedFiles = entityFiles.filter(
    existingFile =>
      existingFile._id &&
      existingFile.type === type &&
      !entity[type === 'attachment' ? 'attachments' : 'documents']?.find(
        attachment => attachment._id?.toString() === existingFile._id.toString()
      )
  );
  await Promise.all(deletedFiles.map(async file => filesAPI.delete(file)));
};

const filterRenamedFiles = (entity: EntityWithFilesSchema, entityFiles: WithId<FileType>[]) => {
  const renamedAttachments = entity.attachments
    ? entity.attachments
        .filter(
          (attachment: FileType) =>
            attachment._id &&
            entityFiles.find(
              file =>
                attachment._id?.toString() === file._id.toString() &&
                file.originalname !== attachment.originalname
            )
        )
        .map((attachment: FileType) => ({
          _id: attachment._id!.toString(),
          originalname: attachment.originalname,
        }))
    : [];

  const renamedDocuments = entity.documents
    ? entity.documents
        .filter(
          (document: FileType) =>
            document._id &&
            entityFiles.find(
              file =>
                document._id?.toString() === file._id.toString() &&
                file.originalname !== document.originalname
            )
        )
        .map((document: FileType) => ({
          _id: document._id!.toString(),
          originalname: document.originalname,
        }))
    : [];

  return { renamedAttachments, renamedDocuments };
};

const processFiles = async (
  entity: EntityWithFilesSchema,
  updatedEntity: EntityWithFilesSchema,
  fileAttachments: FileType[] | undefined,
  documentAttachments: FileType[] | undefined
) => {
  const { attachments, documents } = await prepareNewFiles(
    entity,
    updatedEntity,
    fileAttachments,
    documentAttachments
  );

  if (entity._id && (entity.attachments || entity.documents)) {
    const entityFiles: WithId<FileType>[] = await filesAPI.get(
      { entity: entity.sharedId, type: { $in: ['attachment', 'document'] } },
      '_id, originalname, type'
    );

    await updateDeletedFiles(entityFiles, entity, 'attachment');
    await updateDeletedFiles(entityFiles, entity, 'document');

    const { renamedAttachments, renamedDocuments } = filterRenamedFiles(entity, entityFiles);

    attachments.push(...renamedAttachments);
    documents.push(...renamedDocuments);
  }

  return { proccessedAttachments: attachments, proccessedDocuments: documents };
};

const bindAttachmentToMetadataProperty = (
  _values: MetadataObjectSchema[],
  attachments: FileType[]
) => {
  const values = _values;
  if (_values[0].attachment !== undefined) {
    values[0].value = attachments[_values[0].attachment]
      ? `/api/files/${attachments[_values[0].attachment].filename}`
      : '';
  }
  return values;
};

const handleAttachmentInMetadataProperties = (
  entity: EntityWithFilesSchema,
  attachments: FileType[]
) => {
  Object.entries(entity.metadata || {}).forEach(([_property, _values]) => {
    if (_values && _values.length) {
      const values = bindAttachmentToMetadataProperty(_values, attachments);
      delete values[0].attachment;
    }
  });

  return entity;
};

// eslint-disable-next-line max-statements
const saveEntity = async (
  _entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: reqFiles,
  }: { user: UserSchema; language: string; files?: FileAttachments[] }
) => {
  const fileSaveErrors: string[] = [];

  const { attachments, documents } = (reqFiles || []).reduce(
    (acum, file) => {
      const namedFile = { ...file, filename: generateFileName(file) };
      return set(acum, file.fieldname, namedFile);
    },
    {
      attachments: [] as FileAttachments[],
      documents: [] as FileAttachments[],
    }
  );

  const entity = handleAttachmentInMetadataProperties(_entity, attachments);

  const updatedEntity = await entities.save(
    entity,
    { user, language },
    { includeDocuments: false }
  );

  const { proccessedAttachments, proccessedDocuments } = await processFiles(
    entity,
    updatedEntity,
    attachments,
    documents
  );

  if (proccessedAttachments.length) {
    await Promise.all(
      proccessedAttachments.map(async attachment => {
        try {
          await filesAPI.save(attachment, false);
        } catch (e) {
          errorLog.error(prettifyError(e));
          fileSaveErrors.push(`Could not save supporting file/s: ${attachment.originalname}`);
        }
      })
    );
    await search.indexEntities({ sharedId: updatedEntity.sharedId }, '+fullText');
  }

  if (proccessedDocuments.length) {
    await Promise.all(
      proccessedDocuments.map(async document => {
        try {
          await processDocument(updatedEntity.sharedId, document);
        } catch (e) {
          errorLog.error(prettifyError(e));
          fileSaveErrors.push(`Could not save pdf file/s: ${document.originalname}`);
        }
      })
    );
  }

  const [entityWithAttachments] = await entities.getUnrestrictedWithDocuments(
    {
      sharedId: updatedEntity.sharedId,
      language: updatedEntity.language,
    },
    '+permissions'
  );

  return { entity: entityWithAttachments, errors: fileSaveErrors };
};

export { saveEntity };
