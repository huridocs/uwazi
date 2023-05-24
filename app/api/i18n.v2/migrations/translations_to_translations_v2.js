/* eslint-disable no-await-in-loop */
const flattenTranslations = translation => {
  if (translation.contexts?.length) {
    return translation.contexts.reduce(
      (flatTranslations, context) =>
        flatTranslations.concat(
          context.values
            ? context.values.map(contextValue => ({
                language: translation.locale,
                key: contextValue.key,
                value: contextValue.value,
                context: { type: context.type, label: context.label, id: context.id },
              }))
            : []
        ),
      []
    );
  }
  return [];
};

export default {
  delta: 1,

  name: 'translations to translations v2',

  description:
    'creates indexes for translations v2, migrates all translations from old collection to the new one',

  async up(db) {
    const currentTranslationsCursor = db.collection('translations').find();
    while (await currentTranslationsCursor.hasNext()) {
      const translation = await currentTranslationsCursor.next();
      if (translation) {
        const flattenedTranslations = flattenTranslations(translation);
        if (flattenedTranslations.length) {
          await db.collection('translations_v2').insertMany(flattenedTranslations);
        }
      }
    }
  },
};
