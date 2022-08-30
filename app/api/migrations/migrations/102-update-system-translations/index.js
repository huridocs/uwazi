/* eslint-disable no-await-in-loop */
const updatedKeys = {
  'Create connections and references': 'Create relationships and references',
};

export default {
  delta: 102,

  name: 'update-system-translation-keys',

  description:
    'The migration updates keys entries in the System context of translations, not modifying user translations',

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

        const updatedValues = context.values.map(value => {
          const updatedValue = { ...value };

          if (value.key in updatedKeys) {
            updatedValue.key = updatedKeys[value.key];
          }

          if (value.value in updatedKeys) {
            updatedValue.value = updatedKeys[value.key];
          }

          return updatedValue;
        });

        return { ...context, values: updatedValues };
      });

      await db
        .collection('translations')
        .updateOne({ _id: language._id }, { $set: { contexts: updatedContexts } });
    }
  },
};
