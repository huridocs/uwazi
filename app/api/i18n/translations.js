import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import settings from 'api/settings';

export default {
  get() {
    return request.get(`${dbURL}/_design/translations/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  save(translation) {
    translation.type = 'translation';

    let url = dbURL;
    if (translation._id) {
      url = `${dbURL}/_design/settings/_update/partialUpdate/${translation._id}`;
    }

    return request.post(url, translation)
    .then(response => request.get(`${dbURL}/${response.json.id}`)).then((response) => response.json);
  },

  addEntry(context, key, defaultValue) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        translation.values[context] = translation.values[context] || {};
        translation.values[context][key] = defaultValue;
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  addContext(context, values) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        translation.values[context] = values;
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  deleteContext(context) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        delete translation.values[context];
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  updateContext(oldContextName, newContextName, keyNamesChanges, deletedProperties, context) {
    return Promise.all([this.get(), settings.get()])
    .then(([translations, siteSettings]) => {
      let defaultLanguage = siteSettings.languages.find((lang) => lang.default).key;
      return Promise.all(translations.rows.map((translation) => {
        deletedProperties.forEach((key) => {
          delete translation.values[oldContextName][key];
        });

        Object.keys(keyNamesChanges).forEach((originalKey) => {
          let newKey = keyNamesChanges[originalKey];
          translation.values[oldContextName][newKey] = translation.values[oldContextName][originalKey];

          if (translation.locale === defaultLanguage) {
            translation.values[oldContextName][newKey] = newKey;
          }

          delete translation.values[oldContextName][originalKey];
        });

        Object.keys(context).forEach((key) => {
          if (!translation.values[oldContextName][key]) {
            translation.values[oldContextName][key] = key;
          }
        });

        if (oldContextName !== newContextName) {
          translation.values[newContextName] = translation.values[oldContextName];
          delete translation.values[oldContextName];
        }

        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  }
};
