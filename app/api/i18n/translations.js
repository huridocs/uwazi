import settings from 'api/settings/settings';

import instanceModel from 'api/odm';
import translationsModel from './translationsModel.js';

const model = instanceModel(translationsModel);

function prepareContexts(contexts) {
  return contexts.map((context) => {
    if (context.id === 'System' || context.id === 'Filters' || context.id === 'Menu') {
      context.type = 'Uwazi UI';
    }

    let values = {};
    context.values = context.values || [];
    context.values.forEach((value) => {
      values[value.key] = value.value;
    });

    context.values = values;
    return context;
  });
}

function processContextValues(context) {
  if (context.values && !Array.isArray(context.values)) {
    let values = [];
    Object.keys(context.values).forEach((key) => {
      values.push({key, value: context.values[key]});
    });
    context.values = values;
  }

  return context;
}

function update(translation) {
  return model.get(translation._id)
  .then(([currentTranslationData]) => {
    currentTranslationData.contexts.forEach((context) => {
      let isPresentInTheComingData = translation.contexts.find((_context) => _context.id === context.id);
      if (!isPresentInTheComingData) {
        translation.contexts.push(context);
      }
    });

    translation.contexts = translation.contexts.map(processContextValues);
    return model.save(translation);
  });
}

export default {
  prepareContexts,
  get() {
    return model.get()
    .then((response) => {
      return response.map((translation) => {
        translation.contexts = prepareContexts(translation.contexts);
        return translation;
      });
    });
  },

  save(translation) {
    translation.contexts = translation.contexts || [];
    if (translation._id) {
      return update(translation);
    }

    translation.contexts = translation.contexts.map(processContextValues);
    return model.save(translation);
  },

  addEntry(contextId, key, defaultValue) {
    return model.get()
    .then((result) => {
      return Promise.all(result.map((translation) => {
        let context = translation.contexts.find((ctx) => ctx.id === contextId);
        context.values = context.values || [];
        context.values.push({key, value: defaultValue});
        return this.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  addContext(id, contextName, values, type) {
    let translatedValues = [];
    Object.keys(values).forEach((key) => {
      translatedValues.push({key, value: values[key]});
    });
    return model.get()
    .then((result) => {
      return Promise.all(result.map((translation) => {
        translation.contexts.push({id, label: contextName, values: translatedValues, type});
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
        return model.save(translation);
      }));
    })
    .then(() => {
      return 'ok';
    });
  },

  processSystemKeys(keys) {
    return model.get()
    .then((languages) => {
      let existingKeys = languages[0].contexts.find(c => c.label === 'System').values;
      const newKeys = keys.map(k => k.key);
      let keysToAdd = [];
      keys.forEach((key) => {
        key.label = key.label || key.key;
        if (!existingKeys.find(k => key.key === k.key)) {
          keysToAdd.push({key: key.key, value: key.label});
        }
      });

      languages.forEach((language) => {
        existingKeys = language.contexts.find(c => c.label === 'System').values;
        let valuesWithRemovedValues = existingKeys.filter(i => newKeys.includes(i.key));
        let system = language.contexts.find(c => c.label === 'System');
        system.values = valuesWithRemovedValues.concat(keysToAdd);
      });

      return model.save(languages);
    });
  },

  updateContext(id, newContextName, keyNamesChanges, deletedProperties, values) {
    let translatedValues = [];
    Object.keys(values).forEach((key) => {
      translatedValues.push({key, value: values[key]});
    });

    return Promise.all([model.get(), settings.get()])
    .then(([translations, siteSettings]) => {
      let defaultLanguage = siteSettings.languages.find((lang) => lang.default).key;
      return Promise.all(translations.map((translation) => {
        let context = translation.contexts.find((tr) => tr.id.toString() === id.toString());
        if (!context) {
          translation.contexts.push({id, label: newContextName, values: translatedValues});
          return this.save(translation);
        }

        context.values = context.values || [];
        context.values = context.values.filter(v => !deletedProperties.includes(v.key));

        Object.keys(keyNamesChanges).forEach((originalKey) => {
          let newKey = keyNamesChanges[originalKey];
          let value = context.values.find(v => v.key === originalKey);
          if (value) {
            value.key = newKey;

            if (translation.locale === defaultLanguage) {
              value.value = newKey;
            }
          }
          if (!value) {
            context.values.push({key: newKey, value: values[newKey]});
          }
        });

        Object.keys(values).forEach((key) => {
          if (!context.values.find(v => v.key === key)) {
            context.values.push({key, value: values[key]});
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
