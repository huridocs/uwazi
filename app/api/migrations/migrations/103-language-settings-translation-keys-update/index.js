/* eslint-disable no-await-in-loop */ const obsoleteTranslationKeys = [
  'Default language',
  'Default language description',
  'Some adavanced search features may not be available for this language.',
];

async function insertSystemKeys(db, newKeys) {
  const translations = await db.collection('translations').find().toArray();
  const locales = translations.map(tr => tr.locale);
  const locToSystemContext = {};

  translations.forEach(tr => {
    locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
  });
  const locToKeys = {};
  Object.entries(locToSystemContext).forEach(([loc, context]) => {
    locToKeys[loc] = new Set(context.values.map(v => v.key));
  });

  newKeys.forEach(row => {
    const { key, value: optionalValue } = row;
    locales.forEach(loc => {
      if (!locToKeys[loc].has(key)) {
        const newValue = optionalValue || key;
        locToSystemContext[loc].values.push({ key, value: newValue });
        locToKeys[loc].add(key);
      }
    });
  });

  await Promise.all(
    translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
  );
}

export default {
  delta: 103,
  name: 'language-settings-translation-keys-update',
  description:
    'The migration updates the removed and added keys from language settings into the System context of translations.',
  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const translations = await db.collection('translations').find({});

    while (await translations.hasNext()) {
      const language = await translations.next();
      const updatedContexts = language.contexts.map(context => {
        if (context.id !== 'System') {
          return context;
        }
        const updatedValues = context.values.filter(
          value => !obsoleteTranslationKeys.includes(value.key)
        );
        return { ...context, values: updatedValues };
      });
      await db
        .collection('translations')
        .updateOne({ _id: language._id }, { $set: { contexts: updatedContexts } });
    }

    const systemKeys = [
      { key: 'Available default translation' },
      { key: 'Reset default translation' },
      { key: 'Translations reset successfully' },
      { key: 'Confirm reset translation' },
      { key: 'Are you sure you want to reset translation for' },
      { key: 'System translations' },
      { key: 'Content translations' },
    ];
    await insertSystemKeys(db, systemKeys);
  },
};
