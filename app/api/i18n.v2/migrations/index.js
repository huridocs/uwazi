/* eslint-disable no-await-in-loop */
const flattenTranslations = (translation, languagesByKeyContext) => {
  if (translation.contexts?.length) {
    return translation.contexts.reduce((flatTranslations, context) => {
      if (context.values) {
        context.values.forEach(contextValue => {
          if (!languagesByKeyContext[`${context.id}${contextValue.key}`]) {
            // eslint-disable-next-line no-param-reassign
            languagesByKeyContext[`${context.id}${contextValue.key}`] = {
              key: contextValue.key,
              contextId: context.id,
              languages: [],
              translation: {
                key: contextValue.key,
                value: contextValue.value,
                context: { type: context.type, label: context.label, id: context.id.toString() },
              },
            };
          }
          languagesByKeyContext[`${context.id}${contextValue.key}`].languages.push(
            translation.locale
          );
          flatTranslations.push({
            language: translation.locale,
            key: contextValue.key,
            value: contextValue.value,
            context: { type: context.type, label: context.label, id: context.id.toString() },
          });
        });
      }

      return flatTranslations;
    }, []);
  }
  return [];
};

const newTranslationsCollection = 'translations_v2';

export default {
  delta: 1,

  name: 'translations to translations v2',

  description:
    'creates indexes for translations v2, migrates all translations from old collection to the new one',

  reindex: false,

  async createIndexes(db) {
    await db
      .collection(newTranslationsCollection)
      .createIndex({ language: 1, key: 1, 'context.id': 1 }, { unique: true });

    await db.collection(newTranslationsCollection).createIndex({ 'context.id': 1, key: 1 });
  },

  async up(db) {
    await this.createIndexes(db);
    const newTranslations = await db.collection(newTranslationsCollection);
    await newTranslations.deleteMany({});

    const configuredLanguageKeys = (await db.collection('settings').findOne()).languages.map(
      l => l.key
    );

    const languagesByKeyContext = {};

    const currentTranslationsCursor = await db.collection('translations').find();
    while (await currentTranslationsCursor.hasNext()) {
      const translation = await currentTranslationsCursor.next();
      if (translation) {
        const flattenedTranslations = flattenTranslations(translation, languagesByKeyContext);
        if (flattenedTranslations.length) {
          await newTranslations.insertMany(flattenedTranslations);
        }
      }
    }

    const keyContextMissingInSomeLanguage = Object.values(languagesByKeyContext).reduce(
      (memo, t) => {
        const set = new Set(configuredLanguageKeys);
        t.languages.forEach(key => {
          set.delete(key);
        });
        if (set.size) {
          // eslint-disable-next-line no-param-reassign
          delete t.languages;
          // eslint-disable-next-line no-param-reassign
          t.missingLanguages = Array.from(set);
          memo.push(t);
        }
        return memo;
      },
      []
    );

    if (keyContextMissingInSomeLanguage.length) {
      await keyContextMissingInSomeLanguage.reduce(async (previous, keyContext) => {
        await previous;
        await newTranslations.insertMany(
          keyContext.missingLanguages.map(language => ({ ...keyContext.translation, language }))
        );
      }, Promise.resolve());
    }
  },
};
