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
      const docs = languages.map((lang) => {
        const langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return model.save(docs)
      .then(() => this.getById(sharedId, language));
    });
  },

  get(query, select) {
    return model.get(query, select);
  },

  getById(sharedId, language, select) {
    return this.get({ sharedId, language }, select)
    .then(results => results[0] ? results[0] : Promise.reject(createError('Page not found', 404)));
  },

  delete(sharedId) {
    return model.delete({ sharedId });
  }
};
