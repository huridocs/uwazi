import { WithId } from 'api/odm';
import { attachmentsPath, files } from 'api/files';
import entities from 'api/entities/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { ensure } from 'shared/tsUtils';

const saveEntity = async (
  entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: attachedFiles,
  }: { user: UserSchema; language: string; files?: FileType[] }
) => {
  //compare/save/delete each file
  //IMPORTANT! only update originalname (NOT mimetype/size)

  // const [deletedFile] = await files.delete(req.query);
  // const thumbnailFileName = `${deletedFile._id}.jpg`;
  // await files.delete({ filename: thumbnailFileName });

  const updatedEntity = await entities.save(entity, { user, language });

  const attachments: FileType[] = [];

  const newFiles = attachedFiles?.filter(attachment => !attachment._id);
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

  if (entity._id && entity.attachments) {
    const entityFiles: WithId<FileType>[] = await files.get(
      { entity: entity.sharedId },
      '_id, originalname'
    );
    const renamedFiles = entity.attachments
      .filter(
        (attachment: FileType) =>
          attachment._id &&
          entityFiles.find(
            file =>
              attachment._id!.toString() === file._id.toString() &&
              file.originalname !== attachment.originalname
          )
      )
      .map((attachment: FileType) => ({
        _id: attachment._id!.toString(),
        originalname: attachment.originalname,
      }));

    attachments.push(...renamedFiles);
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
