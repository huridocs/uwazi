import { createError } from 'api/utils';
import ID from 'shared/uniqueID';
import date from 'api/utils/date.js';

import model from './pagesModel';
import settings from '../settings';

export default {
  save(doc, user, language) {
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
    }

    if (doc.sharedId) {
      return model.save(doc);
    }

    return settings.get().then(({ languages }) => {
      const sharedId = ID();
      const docs = languages.map(lang => {
        const langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return model.saveMultiple(docs).then(() => this.getById(sharedId, language));
    });
  },

  get(query, select) {
    return model.get(query, select);
  },

  getById(sharedId, language, select) {
    return this.get({ sharedId, language }, select).then(results =>
      results[0] ? results[0] : Promise.reject(createError('Page not found', 404))
    );
  },

  delete(sharedId) {
    return model.delete({ sharedId });
  },

  async addLanguage(language) {
    const [lanuageTranslationAlreadyExists] = await this.get({ locale: language }, null, {
      limit: 1,
    });
    if (lanuageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await settings.get();

    const defaultLanguage = languages.find(l => l.default).key;
    const duplicate = (offset, totalRows) => {
      const limit = 200;
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get({ language: defaultLanguage }, null, { skip: offset, limit })
        .then(pages => {
          const savePages = pages.map(_page => {
            const page = Object.assign({}, _page);
            delete page._id;
            delete page.__v;
            page.language = language;
            return this.save(page);
          });

          return Promise.all(savePages);
        })
        .then(() => duplicate(offset + limit, totalRows));
    };

    return this.count({ language: defaultLanguage }).then(totalRows => duplicate(0, totalRows));
  },

  async removeLanguage(language) {
    return model.delete({ language });
  },

  count: model.count.bind(model),
};
