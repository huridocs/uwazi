const newKeys = [
  { key: 'Suggestion accepted.' },
  { key: 'Showing' },
  { key: 'Accept suggestion' },
  { key: 'Stats & Filters' },
  { key: 'Labeled' },
  { key: 'Non-labeled' },
  { key: 'Pending' },
  { key: 'Clear all' },
  { key: 'Apply' },
  { key: 'Current value:' },
  { key: 'Suggestion:' },
  { key: 'Stats & Filters' },
  { key: 'Current Value/Suggestion' },
  { key: 'No context' },
];

const deletedKeys = [
  { key: 'Reviewing' },
  { key: 'Confirm suggestion acceptance' },
  { key: 'Apply to all languages' },
  { key: 'Back to dashboard' },
  { key: 'Match / Label' },
  { key: 'Mismatch / Label' },
  { key: 'Match / Value' },
  { key: 'Mismatch / Value' },
  { key: 'Empty / Label' },
  { key: 'Empty / Value' },
  { key: 'State Legend' },
  { key: 'labelMatchDesc' },
  { key: 'labelMismatchDesc' },
  { key: 'labelEmptyDesc' },
  { key: 'valueMatchDesc' },
  { key: 'valueMismatchDesc' },
  { key: 'valueEmptyDesc' },
  { key: 'obsoleteDesc' },
  { key: 'emptyDesc' },
  { key: 'This will update the entity across all languages' },
  { key: 'Mismatch / Empty' },
  { key: 'Empty / Empty' },
  { key: 'emptyMismatchDesc' },
  { key: 'Non-matching' },
  { key: 'Empty / Obsolete' },
  { key: 'This will cancel the finding suggestion process' },
  { key: 'Add properties' },
  { key: 'Show Filters' },
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
  delta: 143,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations for new User/Groups UI in settings',

  async up(db) {
    const keysToInsert = newKeys;
    const keysToDelete = deletedKeys;
    const translations = await db.collection('translations').find().toArray();
    const locToSystemContext = {};
    translations.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    const alreadyInDB = [];
    Object.entries(locToSystemContext).forEach(([loc, context]) => {
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = keysToDelete.find(
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
