import entities, { model } from 'api/entities';
import fs from 'fs';
import path from 'path';
import relationships from 'api/relationships';

import paths from '../config/paths';

const deleteFile = fileName =>
  new Promise(resolve => {
    const filePath = path.join(paths.attachments, fileName);
    fs.unlink(filePath, () => {
      resolve(filePath);
    });
  });

const deleteTextReferences = async (id, language) =>
  relationships.deleteTextReferences(id, language);

const attachmentPresentOn = (siblings, attachment) =>
  siblings.reduce((memo, sibling) => {
    if (sibling.attachments && sibling.attachments.find(a => a.filename === attachment.filename)) {
      return true;
    }
    return memo;
  }, false);

export default {
  async delete(attachmentId) {
    let [entity] = await entities.get({ 'attachments._id': attachmentId });
    let result;
    if (entity) {
      result = this.removeAttachment(entity, attachmentId);
    }

    entity = await entities.getById(attachmentId);
    if (entity) {
      result = this.removeMainFile(entity, attachmentId);
    }

    return result;
  },

  async removeMainFile(entity) {
    const textReferencesDeletions = [];
    const deleteThumbnails = [];
    let siblings = await model.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } });

    textReferencesDeletions.push(deleteTextReferences(entity.sharedId, entity.language));
    deleteThumbnails.push(deleteFile(`${entity._id}.jpg`));

    siblings = siblings.map(e => {
      textReferencesDeletions.push(deleteTextReferences(e.sharedId, e.language));
      deleteThumbnails.push(deleteFile(`${e._id}.jpg`));
      return { ...e, file: null, toc: null };
    });

    const [[savedEntity]] = await Promise.all([
      entities.saveMultiple([{ ...entity, file: null, toc: null }]),
      entities.saveMultiple(siblings),
      textReferencesDeletions,
      deleteThumbnails,
      deleteFile(entity.file.filename),
    ]);

    return savedEntity;
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

    return savedEntity;
  },
};
