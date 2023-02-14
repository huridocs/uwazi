export default {
  delta: 123,

  reindex: false,

  name: 'remove_old_system_key_translations',

  description: 'Delete obsolete translations keys',

  async up(db) {
    const keysToDelete = [
      'Browse your PDFs to upload',
      'For better performance, upload your files in batches of 50 or less.',
    ];
    const translations = await db.collection('translations').find().toArray();
    const locToSystemContext = {};
    translations.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    Object.entries(locToSystemContext).forEach(([_loc, context]) => {
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = keysToDelete.find(deletedKey => deletedKey === currentTranslation.key);
        if (!deleted) {
          newValues.push(currentTranslation);
        }

        return newValues;
      }, []);
      context.values = contextValues;
    });

    await Promise.all(
      translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
    );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
