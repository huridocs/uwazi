const newKeys = [
  { key: 'Active languages' },
  { key: 'Install' },
  { key: 'Install language(s)' },
  { key: 'Please type in' },
  { key: 'Uninstall' },
  { key: 'Default' },
  { key: 'Default language' },
  { key: 'Uninstall language' },
];

const deletedKeys = [
  { key: 'Active Languages' },
  { key: 'Available Languages' },
  { key: 'Confirm add' },
  {
    key: 'This action may take some time while we add the extra language to the entire collection.',
  },
  { key: 'delete language warning' },
  { key: 'Confirm reset translation' },
  { key: 'reset language warning' },
];

const updateTranslation = (currentTranslation, keysToUpdate, loc) => {
  const translation = { ...currentTranslation };
  const newTranslation = keysToUpdate.find(row => row.key === currentTranslation.key);
  if (newTranslation) {
    translation.key = newTranslation.newKey;
    if (loc === 'en' || currentTranslation.value === newTranslation.oldValue) {
      translation.value = newTranslation.newValue;
    }
  }
  return translation;
};

export default {
  delta: 134,

  reindex: false,

  name: 'update_translations',

  description: 'Updates translations for new Languages UI',

  async up(db) {
    const keysToInsert = newKeys;
    const translations = await db.collection('translations').find().toArray();
    const locToSystemContext = {};
    translations.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    const alreadyInDB = [];
    Object.entries(locToSystemContext).forEach(([loc, context]) => {
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = deletedKeys.find(
          deletedTranslation => deletedTranslation.key === currentTranslation.key
        );
        if (!deleted) {
          const translation = updateTranslation(currentTranslation, [], loc);
          newValues.push(translation);
        }
        keysToInsert.forEach(newEntry => {
          if (newEntry.key === currentTranslation.key) {
            alreadyInDB.push(currentTranslation.key);
          }
        });
        return newValues;
      }, []);
      keysToInsert
        .filter(k => !alreadyInDB.includes(k.key))
        .forEach(newEntry => {
          contextValues.push({ key: newEntry.key, value: newEntry.key });
        });
      context.values = contextValues;
    });
    await Promise.all(
      translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
    );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
