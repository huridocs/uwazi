import date from 'api/utils/date.js';
import ID from 'shared/uniqueID';
import settings from '../settings';

import model from './pagesModel';

export default {
  save(doc, user, language) {
    if (!doc._id) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
    }

    if (doc.sharedId) {
      return model.save(doc);
    }

    return settings.get().then(({languages}) => {
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

  get(query) {
    return model.get(query);
  },

  getById(sharedId, language) {
    return this.get({sharedId, language}).then(results => results[0]);
  },

  delete(sharedId) {
    return model.delete({sharedId});
  }
};
