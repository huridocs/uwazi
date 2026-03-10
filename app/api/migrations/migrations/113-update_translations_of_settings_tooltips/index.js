//eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs';
import csv from 'api/csv/csv';

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

const getTranslationChanges = async () => {
  const keysToUpdatePath =
    'app/api/migrations/migrations/113-update_translations_of_settings_tooltips/tooltips_updated_keys.csv';
  const keysToDeletePath =
    'app/api/migrations/migrations/113-update_translations_of_settings_tooltips/removed_keys.csv';

  let fstream = fs.createReadStream(keysToUpdatePath);
  const keysToUpdate = await csv(fstream).read();
  fstream.close();
  fstream = fs.createReadStream(keysToDeletePath);
  const keysToDelete = await csv(fstream).read();
  fstream.close();

  return { keysToUpdate, keysToDelete };
};

export default {
  delta: 113,

  reindex: false,

  name: 'update_translations_of_settings_tooltips',

  description: 'Updates the text for the tooltips of the settings page',

  async up(db) {
    const { keysToUpdate, keysToDelete } = await getTranslationChanges();
    const translations = await db.collection('translations').find().toArray();
    const locToSystemContext = {};
    translations.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    const systemKeys = [
      {
        key: 'Click',
      },
      { key: 'here' },
      { key: 'to learn how to add and configure a contact form on a webpage.' },
    ];
    Object.entries(locToSystemContext).forEach(([loc, context]) => {
      const keysToAdd = [...systemKeys];
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = keysToDelete.find(
          deletedTranslation => deletedTranslation.key === currentTranslation.key
        );
        if (!deleted) {
          const translation = updateTranslation(currentTranslation, keysToUpdate, loc);
          newValues.push(translation);
        }
        systemKeys.forEach(newEntry => {
          if (newEntry.key === currentTranslation.key) {
            keysToAdd.remove(newEntry);
          }
        });
        return newValues;
      }, []);
      keysToAdd.forEach(newEntry => {
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
