import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import settings from 'api/settings';

function addTypeToContexts(contexts) {
  return Promise.all(contexts.map((context) => {
    if (context.id === 'System' || context.id === 'Filters' || context.id === 'Menu') {
      context.type = 'Uwazi UI';
      return Promise.resolve(context);
    }

    return request.get(`${dbURL}/${context.id}`)
    .then((resp) => {
      if (resp.json.type === 'template') {
        context.type = resp.json.isEntity ? 'Entity' : 'Document';
        return context;
      }

      if (resp.json.type === 'thesauri') {
        context.type = 'Dictionary';
        return context;
      }

      if (resp.json.type === 'relationtype') {
        context.type = 'Connection';
        return context;
      }

      context.type = resp.json.type.replace(/\b\w/g, l => l.toUpperCase());
      return context;
    });
  }));
}

export default {
  get() {
    return request.get(`${dbURL}/_design/translations/_view/all`)
    .then((response) => {
      return Promise.all(response.json.rows.map((row) => {
        return addTypeToContexts(row.value.contexts).then((contexts) => {
          row.value.contexts = contexts;
          return row;
        });
      })).then((rows) => {
        response.json.rows = rows;
        return sanitizeResponse(response.json);
      });
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
    .then(() => {
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
    return request.get(`${dbURL}/_design/translations/_view/all`)
    .then((result) => {
      return Promise.all(result.json.rows.map((row) => {
        let translation = row.value;
        translation.contexts = translation.contexts.filter((tr) => tr.id !== id);
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  processSystemKeys(keys) {
    return this.get()
    .then((result) => {
      let languages = result.rows;
      const existingKeys = languages[0].contexts.find(c => c.label === 'System').values;
      const newKeys = keys.map(k => k.key);
      let keysToAdd = {};
      let keysToRemove = Object.keys(existingKeys).filter((i) => newKeys.indexOf(i) < 0);
      keys.forEach((key) => {
        key.label = key.label || key.key;
        if (!existingKeys[key.key]) {
          keysToAdd[key.key] = key.label;
        }
      });

      languages.forEach((language) => {
        let system = language.contexts.find(c => c.label === 'System');
        system.values = Object.assign(system.values, keysToAdd);
        keysToRemove.forEach((toRemove) => {
          delete system.values[toRemove];
        });
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs: languages});
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
