import { WithId } from 'api/odm';
import { attachmentsPath, files } from 'api/files';
import entities from 'api/entities/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { ensure } from 'shared/tsUtils';

async function processNewAttachments(
  attachedFiles: FileType[] | undefined,
  entityAttachments: FileType[] | undefined,
  updatedEntity: EntityWithFilesSchema
) {
  const attachments: FileType[] = [];
  const newFiles = attachedFiles?.filter(attachment => !attachment._id);
  const newUrls = entityAttachments?.filter(attachment => !attachment._id && attachment.url);

  if (newFiles && newFiles.length) {
    await Promise.all(
      newFiles.map(async (file: any) => {
        const savedFile = ensure<FileType>(await files.storeFile(attachmentsPath, file));
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

const saveEntity = async (
  entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: attachedFiles,
  }: { user: UserSchema; language: string; files?: FileType[] }
) => {
  const updatedEntity = await entities.save(entity, { user, language });
  const attachments = await processNewAttachments(attachedFiles, entity.attachments, updatedEntity);

  if (entity._id && entity.attachments) {
    const entityFiles: WithId<FileType>[] = await files.get(
      { entity: entity.sharedId, type: 'attachment' },
      '_id, originalname'
    );
    await updateDeletedAttachments(entityFiles, entity);
    const renamedAttachments = filterRenamedAttachments(entity, entityFiles);
    attachments.push(...renamedAttachments);
  }
  await Promise.all(attachments.map(async attachment => files.save(attachment, false)));

  const [entityWithAttachments] = await entities.getUnrestrictedWithDocuments(
    {
      sharedId: updatedEntity.sharedId,
      language: updatedEntity.language,
    },
    '+permissions'
  );
  return entityWithAttachments;
};

export { saveEntity };
