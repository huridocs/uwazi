const newKeys = [
  {
    key: 'Language Install Start Message',
    defaultValue:
      'Language installation process initiated. It may take several minutes to complete depending on the size of the collection. Please wait until the installation process is finished.',
  },
  {
    key: 'Language Uninstall Start Message',
    defaultValue:
      'Language uninstallation process initiated. It may take several minutes to complete depending on the size of the collection.  Please wait until the uninstallation process is finished.',
  },
  {
    key: 'An error has occured while installing languages:',
  },
  {
    key: 'An error has occured while deleting a language:',
  },
  {
    key: 'Language uninstalled successfully',
  },
];

const deletedKeys = [
  {
    key: 'Language uninstalled success',
  },
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
  delta: 142,

  reindex: false,

  name: 'update_translations',

  description: 'Add and remove translation keys for new language installation flow',

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
          contextValues.push({ key: newEntry.key, value: newEntry.defaultValue || newEntry.key });
        });
      context.values = contextValues;
    });

    await Promise.all(
      translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
    );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
