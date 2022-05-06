/* eslint-disable max-lines */
/* eslint-disable max-statements */
import thesauri from 'api/thesauri/thesauri';
import settings from 'api/settings/settings';
import model from './translationsModel.js';

function prepareContexts(contexts) {
  return contexts.map(context => ({
    ...context,
    type:
      context.id === 'System' || context.id === 'Filters' || context.id === 'Menu'
        ? 'Uwazi UI'
        : context.type,
    values: context.values
      ? context.values.reduce((values, value) => {
          values[value.key] = value.value; //eslint-disable-line no-param-reassign
          return values;
        }, {})
      : {},
  }));
}

function checkDuplicateKeys(context, values) {
  if (!values) return;

  const seen = new Set();
  values.forEach(value => {
    if (seen.has(value.key)) {
      throw new Error(
        `Process is trying to save repeated translation key ${value.key} in context ${context.id} (${context.type}).`
      );
    }
    seen.add(value.key);
  });
}

function processContextValues(context) {
  let values;

  if (context.values && !Array.isArray(context.values)) {
    values = [];
    Object.keys(context.values).forEach(key => {
      values.push({ key, value: context.values[key] });
    });
  }

  values = values || context.values;

  checkDuplicateKeys(context, values);

  return { ...context, values };
}

const propagateTranslation = async (translation, currentTranslationData) => {
  await currentTranslationData.contexts.reduce(async (promise, context) => {
    await promise;

    const isPresentInTheComingData = translation.contexts.find(
      _context => _context.id.toString() === context.id.toString()
    );

    if (isPresentInTheComingData && isPresentInTheComingData.type === 'Thesaurus') {
      const thesaurus = await thesauri.getById(context.id);

      const valuesChanged = isPresentInTheComingData.values.reduce((changes, value) => {
        const currentValue = context.values.find(v => v.key === value.key);
        if (currentValue && currentValue.value !== value.value) {
          return { ...changes, [currentValue.key]: value.value };
        }
        return changes;
      }, {});

      const changesMatchingDictionaryId = Object.keys(valuesChanged)
        .map(valueChanged => {
          const valueFound = thesaurus.values.find(v => v.label === valueChanged);
          if (valueFound) {
            return { id: valueFound.id, value: valuesChanged[valueChanged] };
          }
          return null;
        })
        .filter(a => a);

      return Promise.all(
        changesMatchingDictionaryId.map(change =>
          thesauri.renameThesaurusInMetadata(
            change.id,
            change.value,
            context.id,
            translation.locale
          )
        )
      );
    }
    return Promise.resolve();
  }, Promise.resolve());
};

const update = async translation => {
  const currentTranslationData = await model.getById(translation._id);

  translation.contexts = translation.contexts.map(processContextValues);

  await propagateTranslation(translation, currentTranslationData);

  currentTranslationData.contexts.forEach(context => {
    const isPresentInTheComingData = translation.contexts.find(
      _context => _context.id.toString() === context.id.toString()
    );

    if (!isPresentInTheComingData) {
      translation.contexts.push(context);
    }
  });

  return model.save({ ...translation, contexts: translation.contexts.map(processContextValues) });
};

export default {
  prepareContexts,
  get(query = {}) {
    return model.get(query).then(response =>
      response.map(translation => ({
        ...translation,
        contexts: prepareContexts(translation.contexts),
      }))
    );
  },

  save(translation) {
    if (translation._id) {
      return update(translation);
    }

    return model.save({
      ...translation,
      contexts: translation.contexts && translation.contexts.map(processContextValues),
    });
  },

  addEntry(contextId, key, defaultValue) {
    return model
      .get()
      .then(result =>
        Promise.all(
          result.map(translation => {
            const context = translation.contexts.find(ctx => ctx.id === contextId);
            if (!context) {
              return Promise.resolve();
            }
            context.values = context.values || [];
            context.values.push({ key, value: defaultValue });
            return this.save(translation);
          })
        )
      )
      .then(() => 'ok');
  },

  async updateEntries(contextId, keyValuePairsPerLanguage) {
    // keyValuePairsPerLanguage expected in the form of:
    // { 'en': { 'key': 'value', ...}, 'es': { 'key': 'value', ...}, ... }

    const languages = new Set((await settings.get({}, 'languages')).languages.map(l => l.key));
    const languagesToUpdate = Object.keys(keyValuePairsPerLanguage).filter(l => languages.has(l));

    return Promise.all(
      (await model.get({ locale: { $in: languagesToUpdate } })).map(translation => {
        const context = translation.contexts.find(c => c.id === contextId);
        if (!context) {
          return Promise.resolve();
        }
        const valueDict = Object.fromEntries(context.values.map(({ key, value }) => [key, value]));
        const missingKeys = Object.keys(keyValuePairsPerLanguage[translation.locale]).filter(
          key => !(key in valueDict)
        );
        if (missingKeys.length) {
          throw new Error(
            `Process is trying to update missing translation keys: ${translation.locale} - ${contextId} - ${missingKeys}.`
          );
        }
        Object.entries(keyValuePairsPerLanguage[translation.locale]).forEach(([key, value]) => {
          valueDict[key] = value;
        });
        context.values = Object.entries(valueDict).map(([key, value]) => ({ key, value }));
        return this.save(translation);
      })
    );
  },

  addContext(id, contextName, values, type) {
    const translatedValues = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });
    return model
      .get()
      .then(result =>
        Promise.all(
          result.map(translation => {
            translation.contexts.push({ id, label: contextName, values: translatedValues, type });
            return this.save(translation);
          })
        )
      )
      .then(() => 'ok');
  },

  deleteContext(id) {
    return model
      .get()
      .then(result =>
        Promise.all(
          result.map(translation =>
            model.save({
              ...translation,
              contexts: translation.contexts.filter(tr => tr.id !== id),
            })
          )
        )
      )
      .then(() => 'ok');
  },

  processSystemKeys(keys) {
    return model.get().then(languages => {
      let existingKeys = new Set(
        languages[0].contexts.find(c => c.label === 'System').values.map(v => v.key)
      );
      const newKeys = new Set(keys.map(k => k.key));
      const keysToAdd = keys
        .filter(key => !existingKeys.has(key.key))
        .map(key => ({ key: key.key, value: key.label || key.key }));

      languages.forEach(language => {
        let system = language.contexts.find(c => c.label === 'System');
        if (!system) {
          system = {
            id: 'System',
            label: 'System',
            values: keys.map(k => ({ key: k.key, value: k.label || k.key })),
          };
          language.contexts.unshift(system);
        }
        existingKeys = system.values;
        const valuesWithRemovedValues = existingKeys.filter(i => newKeys.has(i.key));
        system.values = valuesWithRemovedValues.concat(keysToAdd);
      });

      return model.saveMultiple(languages);
    });
  },

  updateContext(id, newContextName, keyNamesChanges, deletedProperties, values, type) {
    const translatedValues = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });

    return Promise.all([model.get(), settings.get()])
      .then(([translations, siteSettings]) => {
        const defaultLanguage = siteSettings.languages.find(lang => lang.default).key;
        return Promise.all(
          translations.map(translation => {
            const context = translation.contexts.find(tr => tr.id.toString() === id.toString());
            if (!context) {
              translation.contexts.push({
                id,
                label: newContextName,
                values: translatedValues,
                type,
              });
              return this.save(translation);
            }

            context.values = context.values || [];
            context.values = context.values.filter(v => !deletedProperties.includes(v.key));
            context.type = type;

            Object.keys(keyNamesChanges).forEach(originalKey => {
              const newKey = keyNamesChanges[originalKey];
              const value = context.values.find(v => v.key === originalKey);
              if (value) {
                value.key = newKey;

                if (translation.locale === defaultLanguage) {
                  value.value = newKey;
                }
              }
              if (!value) {
                context.values.push({ key: newKey, value: values[newKey] });
              }
            });

            Object.keys(values).forEach(key => {
              if (!context.values.find(v => v.key === key)) {
                context.values.push({ key, value: values[key] });
              }
            });

            context.label = newContextName;

            return this.save(translation);
          })
        );
      })
      .then(() => 'ok');
  },

  async addLanguage(language) {
    const [languageTranslationAlreadyExists] = await model.get({ locale: language });
    if (languageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await settings.get();

    const [defaultTranslation] = await model.get({ locale: languages.find(l => l.default).key });

    return model.save({
      ...defaultTranslation,
      _id: null,
      locale: language,
      contexts: defaultTranslation.contexts.map(({ _id, ...context }) => context),
    });
  },

  async removeLanguage(language) {
    return model.delete({ locale: language });
  },
};
