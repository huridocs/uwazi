import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import settings from 'api/settings';

import instanceModel from 'api/odm';
import translationsModel from './translationsModel.js';

const model = instanceModel(translationsModel);

function addTypeToContexts(contexts) {
  return Promise.all(contexts.map((context) => {
    if (context.id === 'System' || context.id === 'Filters' || context.id === 'Menu') {
      context.type = 'Uwazi UI';
    }

    return Promise.resolve(context);
  }));
}

export default {
  get() {
    return model.get()
    .then((response) => {
      return Promise.all(response.map((translation) => {
        return addTypeToContexts(translation.contexts).then((contexts) => {
          translation.contexts = contexts;
          return translation;
        });
      }));
    });
  },

  save(translation) {
    return model.save(translation);
  },

  addEntries(entries) {
    return this.get()
    .then((result) => {
      return Promise.all(result.map((translation) => {
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
      return Promise.all(result.map((translation) => {
        let context = translation.contexts.find((ctx) => ctx.id === contextId);
        context.values[key] = defaultValue;
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  addContext(id, contextName, values, type) {
    return model.get()
    .then((result) => {
      return Promise.all(result.map((translation) => {
        translation.contexts.push({id, label: contextName, values, type});
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  deleteContext(id) {
    return model.get()
    .then((result) => {
      return Promise.all(result.map((translation) => {
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
    .then((languages) => {
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

      return model.save(languages);
    });
  },

  updateContext(id, newContextName, keyNamesChanges, deletedProperties, values) {
    return Promise.all([this.get(), settings.get()])
    .then(([translations, siteSettings]) => {
      let defaultLanguage = siteSettings.languages.find((lang) => lang.default).key;
      return Promise.all(translations.map((translation) => {
        let context = translation.contexts.find((tr) => tr.id.toString() === id.toString());
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
