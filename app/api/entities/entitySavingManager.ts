import { WithId } from 'api/odm';
import { attachmentsPath, files, generateFileName, storeFile } from 'api/files';
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
  encoding?: string;
  fieldname?: string;
};

async function prepareNewAttachments(
  entityAttachments: FileType[] = [],
  fileAttachments: FileType[] = [],
  updatedEntity: EntityWithFilesSchema
) {
  const attachments: FileType[] = [];
  const newFiles = fileAttachments.filter(attachment => !attachment._id);
  const newUrls = entityAttachments.filter(attachment => !attachment._id && attachment.url);

  if (newFiles.length) {
    await Promise.all(
      newFiles.map(async (file: any) => {
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

  return attachments;
}

const updateDeletedAttachments = async (
  entityFiles: WithId<FileType>[],
  entity: EntityWithFilesSchema
) => {
  const deletedAttachments = entityFiles.filter(
    existingAttachment =>
      existingAttachment._id &&
      !entity.attachments!.find(
        attachment => attachment._id?.toString() === existingAttachment._id.toString()
      )
  );
  await Promise.all(deletedAttachments.map(async attachment => files.delete(attachment)));
};

const filterRenamedAttachments = (entity: EntityWithFilesSchema, entityFiles: WithId<FileType>[]) =>
  entity.attachments
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

const processAttachments = async (
  entity: EntityWithFilesSchema,
  updatedEntity: EntityWithFilesSchema,
  fileAttachments: FileType[] | undefined
) => {
  const attachments = await prepareNewAttachments(
    entity.attachments,
    fileAttachments,
    updatedEntity
  );

  if (entity._id && entity.attachments) {
    const entityFiles: WithId<FileType>[] = await files.get(
      { entity: entity.sharedId, type: 'attachment' },
      '_id, originalname'
    );
    await updateDeletedAttachments(entityFiles, entity);
    const renamedAttachments = filterRenamedAttachments(entity, entityFiles);
    attachments.push(...renamedAttachments);
  }

  return attachments;
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
      attachments: [],
      documents: [],
    }
  );

  const entity = handleAttachmentInMetadataProperties(_entity, attachments);

  const updatedEntity = await entities.save(
    entity,
    { user, language },
    { includeDocuments: false }
  );

  await Promise.all(
    documents.map(async document => {
      await processDocument(updatedEntity, document);
    })
  );

  const proccessedAttachments = await processAttachments(entity, updatedEntity, attachments);

  if (proccessedAttachments.length) {
    await Promise.all(
      proccessedAttachments.map(async attachment => {
        try {
          await files.save(attachment, false);
        } catch (e) {
          errorLog.error(prettifyError(e));
          fileSaveErrors.push(`Could not save supporting file/s: ${attachment.originalname}`);
        }
      })
    );
    await search.indexEntities({ sharedId: updatedEntity.sharedId }, '+fullText');
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
