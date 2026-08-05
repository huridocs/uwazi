import { createError } from '#api/utils/index.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

const documents = {
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

  async fullText(_id) {
    if (!_id) {
      throw createError('document does not exists', 404);
    }

    const document = (
      await FilesDAOFactory.default().getById(_id.toString(), { withFullText: true })
    ).getData(null);

    if (!document || !document.fullText) {
      throw createError('document does not exists', 404);
    }

    const pageNumberMatch = /\[\[(\d+)\]\]/g;
    // Form-feed separates pages so the client can render page containers for SEO.
    return Object.keys(document.fullText)
      .map(Number)
      .sort((a, b) => a - b)
      .map(page => document.fullText[page].replace(pageNumberMatch, ''))
      .join('\f');
  },
};

export { documents };
