import entities from 'api/entities/entities';
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

function processContextValues(context) {
  let values;
  if (context.values && !Array.isArray(context.values)) {
    values = [];
    Object.keys(context.values).forEach(key => {
      values.push({ key, value: context.values[key] });
    });
  }

  return { ...context, values: values || context.values };
}

const propagateTranslation = async (translation, currentTranslationData) => {
  await currentTranslationData.contexts.reduce(async (promise, context) => {
    await promise;

    const isPresentInTheComingData = translation.contexts.find(
      _context => _context.id.toString() === context.id.toString()
    );

    if (isPresentInTheComingData && isPresentInTheComingData.type === 'Dictionary') {
      const thesaurus = await thesauri.getById(context.id);

      const valuesChanged = isPresentInTheComingData.values.reduce((changes, value) => {
        const currentValue = context.values.find(v => v.key === value.key);
        if (currentValue && currentValue.value !== value.value) {
          return { ...changes, [currentValue.key]: value.value };
        }
        return changes;
      }, {});

      const changesMathingDictionaryId = Object.keys(valuesChanged)
        .map(valueChanged => {
          const valueFound = thesaurus.values.find(v => v.label === valueChanged);
          if (valueFound) {
            return { id: valueFound.id, value: valuesChanged[valueChanged] };
          }
          return null;
        })
        .filter(a => a);

      return Promise.all(
        changesMathingDictionaryId.map(change =>
          entities.renameThesaurusInMetadata(
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
      let existingKeys = languages[0].contexts.find(c => c.label === 'System').values;
      const newKeys = keys.map(k => k.key);
      const keysToAdd = [];
      keys.forEach(key => {
        if (!existingKeys.find(k => key.key === k.key)) {
          keysToAdd.push({ key: key.key, value: key.label || key.key });
        }
      });

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
        const valuesWithRemovedValues = existingKeys.filter(i => newKeys.includes(i.key));
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
