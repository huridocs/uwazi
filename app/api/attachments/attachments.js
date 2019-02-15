import { model } from 'api/entities';
import fs from 'fs';
import path from 'path';
import relationships from 'api/relationships';

import { attachmentsPath } from '../config/paths';

const deleteFile = fileName =>
  new Promise((resolve) => {
    const filePath = path.join(attachmentsPath, fileName);
    fs.unlink(filePath, () => {
      resolve(filePath);
    });
  });

const deleteTextReferences = async (id, language) =>
  relationships.deleteTextReferences(id, language);

export default {
  async removeMainFile(entity) {
    const textReferencesDeletions = [];
    const deleteThumbnails = [];
    let siblings = await model.get({
      sharedId: entity.sharedId,
      _id: { $ne: entity._id },
    });

    // textReferencesDeletions.push(
    //   deleteTextReferences(entity.sharedId, entity.language),
    // );
    deleteThumbnails.push(deleteFile(`${entity._id}.jpg`));

    // siblings = siblings.map((e) => {
    //   // textReferencesDeletions.push(
    //   //   deleteTextReferences(e.sharedId, e.language),
    //   // );
    //   // deleteThumbnails.push(deleteFile(`${e._id}.jpg`));
    //   // e.attachments = (e.attachments || []).filter(a => a.filename !== attachmentToDelete.filename);
    //   return { ...e, file: null, toc: null };
    // });

    return Promise.all([
      model.save({ ...entity, file: null, toc: null }),
      // model.save(siblings),
      // textReferencesDeletions,
      deleteThumbnails,
      deleteFile(entity.file.filename)
    ]).then(([entity]) => entity);
  },

  async removeAttachment(entity, attachmentId) {
    let siblings = await model.get({
      sharedId: entity.sharedId,
      _id: { $ne: entity._id },
    });

    const attachmentToDelete = entity.attachments.find(a => a._id.equals(attachmentId));
    entity.attachments = (entity.attachments || []).filter(a => !a._id.equals(attachmentId));

    const shouldUnlink = siblings.reduce((memo, sibling) => {
      if (sibling.attachments && sibling.attachments.find(a => a.filename === attachmentToDelete.filename)) {
        return false;
      }
      return memo;
    }, true);

    await model.save(entity);

    if (!shouldUnlink) {
      return entity;
    }

    await deleteFile(attachmentToDelete.filename);
    return entity;
  }
};
