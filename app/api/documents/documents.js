import { createError } from 'api/utils';
import { files } from 'api/files';
import entities from '../entities';

const documents = {
  save(doc, params) {
    delete doc.file;
    return entities.save(doc, params);
  },

  async page(_id, page) {
    const [document] = await files.get({ _id }, '+fullText');
    if (!document || !document.fullText) {
      throw createError('document does not exists', 404);
    }

    if (typeof document.fullText[page] === 'undefined') {
      throw createError('page does not exists', 404);
    }

    const pageNumberMatch = /\[\[(\d+)\]\]/g;
    return document.fullText[page].replace(pageNumberMatch, '');
  },

  get(query, select) {
    return entities.get(query, select);
  },

  getById(sharedId, language) {
    return entities.getById(sharedId, language);
  },

  countByTemplate(templateId) {
    return entities.countByTemplate(templateId);
  },

  delete(id) {
    return entities.delete(id);
  },
};

export default documents;
export { documents };
