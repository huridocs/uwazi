import entities, { model } from 'api/entities';
import fs from 'fs';
import path from 'path';

import paths from '../config/paths';

const deleteFile = fileName =>
  new Promise(resolve => {
    const filePath = path.join(paths.attachments, fileName);
    fs.unlink(filePath, () => {
      resolve(filePath);
    });
  });

const attachmentPresentOn = (siblings, attachment) =>
  siblings.reduce((memo, sibling) => {
    if (sibling.attachments && sibling.attachments.find(a => a.filename === attachment.filename)) {
      return true;
    }
    return memo;
  }, false);

export default {
  async delete(attachmentId) {
    const [entity] = await entities.get({ 'attachments._id': attachmentId });
    let result;
    if (entity) {
      result = this.removeAttachment(entity, attachmentId);
    }

    return result;
  },

  async removeAttachment(entity, attachmentId) {
    const siblings = await model.get({
      sharedId: entity.sharedId,
      _id: { $ne: entity._id },
    });

    const attachmentToDelete = entity.attachments.find(a => a._id.equals(attachmentId));

    const [savedEntity] = await entities.saveMultiple([
      {
        ...entity,
        attachments: (entity.attachments || []).filter(a => !a._id.equals(attachmentId)),
      },
    ]);

    const shouldUnlink = !attachmentPresentOn(siblings, attachmentToDelete);
    if (shouldUnlink) {
      await deleteFile(attachmentToDelete.filename);
    }

    const [result] = await entities.get({ _id: savedEntity._id });
    return result;
  },
};
