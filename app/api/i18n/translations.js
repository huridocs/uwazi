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

  addEntries(entries) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        entries.forEach(({contextId, key, defaultValue}) => {
          let context = translation.contexts.find((ctx) => ctx.id === contextId);
          context.values[key] = defaultValue;
        });
        return this.save(translation);
      }));
    })
    .then((results) => {
      console.log(results);
      return 'ok';
    });
  },

  addEntry(contextId, key, defaultValue) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        let context = translation.contexts.find((ctx) => ctx.id === contextId);
        context.values[key] = defaultValue;
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  addContext(id, contextName, values) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        translation.contexts.push({id, label: contextName, values});
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  deleteContext(id) {
    return this.get()
    .then((result) => {
      return Promise.all(result.rows.map((translation) => {
        translation.contexts = translation.contexts.filter((tr) => tr.id !== id);
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  updateContext(id, newContextName, keyNamesChanges, deletedProperties, values) {
    return Promise.all([this.get(), settings.get()])
    .then(([translations, siteSettings]) => {
      let defaultLanguage = siteSettings.languages.find((lang) => lang.default).key;
      return Promise.all(translations.rows.map((translation) => {
        let context = translation.contexts.find((tr) => tr.id === id);
        if (!context) {
          translation.contexts.push({id, label: newContextName, values});
          return this.save(translation);
        }

        deletedProperties.forEach((key) => {
          delete context.values[key];
        });

        Object.keys(keyNamesChanges).forEach((originalKey) => {
          let newKey = keyNamesChanges[originalKey];
          context.values[newKey] = context.values[originalKey];

          if (translation.locale === defaultLanguage) {
            context.values[newKey] = newKey;
          }

          delete context.values[originalKey];
        });

        Object.keys(values).forEach((key) => {
          if (!context.values[key]) {
            context.values[key] = key;
          }
        });

        context.label = newContextName;

        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  }
};
