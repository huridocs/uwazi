import { ObjectId } from 'mongodb';

let timeoffset = 1;
const generateTimestamp = () => {
  const result = Date.now() + timeoffset;
  timeoffset += 1;
  return result;
};

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
            _id: new ObjectId(),
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

const newTranslationsCollection = 'translationsV2';

export default {
  delta: 144,

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
    timeoffset = 1;
    process.stdout.write(`${this.name}...\r\n`);
    await this.createIndexes(db);
    const newTranslations = await db.collection(newTranslationsCollection);
    await newTranslations.deleteMany({});
    const updatelogs = await db.collection('updatelogs');
    await updatelogs.deleteMany({ namespace: newTranslationsCollection });

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
          await updatelogs.insertMany(
            flattenedTranslations.map(t => ({
              namespace: newTranslationsCollection,
              deleted: false,
              mongoId: t._id,
              timestamp: generateTimestamp(),
            }))
          );
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
        const missingForLanguage = keyContext.missingLanguages.map(language => ({
          ...keyContext.translation,
          language,
          _id: new ObjectId(),
        }));
        await newTranslations.insertMany(missingForLanguage);
        await updatelogs.insertMany(
          missingForLanguage.map(t => ({
            namespace: newTranslationsCollection,
            deleted: false,
            mongoId: t._id,
            timestamp: generateTimestamp(),
          }))
        );
      }, Promise.resolve());
    }
  },
};
