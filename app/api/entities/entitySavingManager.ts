import { set } from 'lodash';
import { generateFileName } from 'api/files';
import entities from 'api/entities/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { UserSchema } from 'shared/types/userType';
import { handleAttachmentInMetadataProperties, processFiles, saveFiles } from './managerFunctions';

type FileAttachments = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding?: string;
};

const saveEntity = async (
  _entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: reqFiles,
    socketEmiter,
  }: { user: UserSchema; language: string; socketEmiter?: Function; files?: FileAttachments[] }
) => {
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

  const fileSaveErrors = await saveFiles(
    proccessedAttachments,
    proccessedDocuments,
    updatedEntity,
    socketEmiter
  );

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
