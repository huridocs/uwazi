import { set } from 'lodash';
import entities from '../entities/entities.js';
import { EntityWithFilesSchema } from '../../shared/types/entityType.js';
import { UserSchema } from '../../shared/types/userType.js';
import { handleAttachmentInMetadataProperties, processFiles, saveFiles } from './managerFunctions';

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
