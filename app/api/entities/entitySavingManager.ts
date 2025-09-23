import { set } from 'lodash';
import entities from 'api/entities/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { UserSchema } from 'shared/types/userType';
import { handleAttachmentInMetadataProperties, processFiles, saveFiles } from './managerFunctions';
import { isValidUrl, sanitizeUrl } from 'shared/urlValidationUtils';

const validateAndSanitizeUrls = (entity: EntityWithFilesSchema): EntityWithFilesSchema => {
  if (!entity.metadata) return entity;

  const sanitizedEntity = { ...entity };
  if (!sanitizedEntity.metadata) return sanitizedEntity;

  Object.entries(sanitizedEntity.metadata).forEach(([_key, values]) => {
    if (Array.isArray(values)) {
      values.forEach(value => {
        if (value && typeof value.value === 'string' && value.value.startsWith('http')) {
          if (!isValidUrl(value.value)) {
            value.value = '';
            return;
          }

          const sanitizedUrl = sanitizeUrl(value.value);
          if (sanitizedUrl !== value.value) {
            value.value = sanitizedUrl;
          }
        }
      });
    }
  });

  return sanitizedEntity;
};

const saveEntity = async (
  _entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: reqFiles,
  }: { user: UserSchema; language: string; socketEmiter?: Function; files?: FileAttachment[] }
) => {
  const { attachments, documents } = (reqFiles || []).reduce(
    (acum, file) => set(acum, file.fieldname, file),
    {
      attachments: [] as FileAttachment[],
      documents: [] as FileAttachment[],
    }
  );

  const sanitizedEntity = validateAndSanitizeUrls(_entity);
  const entity = handleAttachmentInMetadataProperties(sanitizedEntity, attachments);

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

  const fileSaveErrors = await saveFiles(proccessedAttachments, proccessedDocuments, updatedEntity);

  const [entityWithAttachments]: EntityWithFilesSchema[] =
    await entities.getUnrestrictedWithDocuments(
      {
        sharedId: updatedEntity.sharedId,
        language: updatedEntity.language,
      },
      '+permissions'
    );

  return { entity: entityWithAttachments, errors: fileSaveErrors };
};

export type FileAttachment = {
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding?: string;
  destination: string;
  filename: string;
  path: string;
};

export { saveEntity };
