import entities, { model } from 'api/entities';
import { deleteFile, attachmentsPath } from 'api/files/filesystem';
import { ObjectId } from 'mongodb';
import { EntitySchema } from 'shared/types/entityType';
import { AttachmentSchema } from 'shared/types/commonTypes';

const attachmentPresentOn = (siblings: EntitySchema[], attachment?: AttachmentSchema) =>
  attachment
    ? siblings.reduce((memo, sibling) => {
        if (
          sibling.attachments &&
          sibling.attachments.find(a => a.filename === attachment.filename)
        ) {
          return true;
        }
        return memo;
      }, false)
    : false;

export default {
  async delete(attachmentId: ObjectId) {
    const [entity] = await entities.get({ 'attachments._id': attachmentId });
    let result;
    if (entity) {
      result = this.removeAttachment(entity, attachmentId);
    }

    return result;
  },

  async removeAttachment(entity: EntitySchema, attachmentId: ObjectId) {
    const siblings = await model.get({
      sharedId: entity.sharedId,
      _id: { $ne: entity._id },
    });

    const attachmentToDelete = (entity.attachments || []).find(a => a._id.equals(attachmentId));

    const [savedEntity] = await entities.saveMultiple([
      {
        ...entity,
        attachments: (entity.attachments || []).filter(a => !a._id.equals(attachmentId)),
      },
    ]);

    const shouldUnlink = !attachmentPresentOn(siblings, attachmentToDelete);
    if (shouldUnlink && attachmentToDelete?.filename) {
      await deleteFile(attachmentsPath(attachmentToDelete.filename));
    }

    const [result] = await entities.get({ _id: savedEntity._id });
    return result;
  },
};
