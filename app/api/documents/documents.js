import { createError } from '#api/utils/index.js';
import entities from '../entities/index.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

const documents = {
  save(doc, params) {
    const sanitizedDoc = { ...doc };
    delete sanitizedDoc.file;
    return entities.save(sanitizedDoc, params);
  },

  async page(_id, page) {
    if (!_id) {
      throw createError('document does not exists', 404);
    }

    const document = (
      await FilesDAOFactory.default().getById(_id.toString(), { withFullText: true })
    ).getData(null);

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

  /**
   * @deprecated
   * This method is deprecated and should not be used anymore.
   */
  delete(id) {
    return entities.delete(id);
  },
};

export { documents };
