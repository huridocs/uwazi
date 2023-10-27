export default {
  delta: 145,

  name: 'remove-obsolete-translation-keys-in-v2',

  description:
    'The migration removes known obsoleted entries in the System context of translations.',

  reindex: false,

  async up(db) {
    await db.collection('translationsV2').deleteMany({ key: 'Confirm New Passowrd' });
    await db.collection('translationsV2').deleteMany({ key: 'New Password' });

    const translationsV1 = await db.collection('translations').find().toArray();
    const locToSystemContext = {};

    translationsV1.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    Object.entries(locToSystemContext).forEach(([_loc, context]) => {
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = ['Confirm New Passowrd', 'New Password'].find(
          deletedKey => deletedKey === currentTranslation.key
        );

        if (!deleted) {
          newValues.push(currentTranslation);
        }

        return newValues;
      }, []);
      context.values = contextValues;
    });

    await Promise.all(
      translationsV1.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
    );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
