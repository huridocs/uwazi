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
  const keysToInsertPath =
    'app/api/migrations/migrations/119-update_problematic_UI_translations/system_keys.csv';
  const keysToUpdatePath =
    'app/api/migrations/migrations/119-update_problematic_UI_translations/updated_keys.csv';
  const keysToDeletePath =
    'app/api/migrations/migrations/119-update_problematic_UI_translations/removed_keys.csv';

  let fstream = fs.createReadStream(keysToInsertPath);
  const keysToInsert = await csv(fstream).read();
  fstream.close();
  fstream = fs.createReadStream(keysToUpdatePath);
  const keysToUpdate = await csv(fstream).read();
  fstream.close();
  fstream = fs.createReadStream(keysToDeletePath);
  const keysToDelete = await csv(fstream).read();
  fstream.close();

  return { keysToInsert, keysToUpdate, keysToDelete };
};

export default {
  delta: 119,

  reindex: false,

  name: 'update_problematic_UI_translations',

  description: 'Updates some translations reported with errors',

  async up(db) {
    const { keysToInsert, keysToUpdate, keysToDelete } = await getTranslationChanges();
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
          const translation = updateTranslation(currentTranslation, keysToUpdate, loc);
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
