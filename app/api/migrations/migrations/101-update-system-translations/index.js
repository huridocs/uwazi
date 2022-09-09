/* eslint-disable no-await-in-loop */
const updatedKeys = {
  'Create connections and references': 'Create relationships and references',
  'Add connection': 'Add relationship',
  'Confirm delete connection type:': 'Confirm delete relationship type:',
  'Are you sure you want to delete this connection type?':
    'Are you sure you want to delete this relationship type?',
  'Cannot delete connection type:': 'Cannot delete relationship type:',
  'This connection type is being used and cannot be deleted.':
    'This relationship type is being used and cannot be deleted.',
  connections: 'relationships',
  'Changing the type will erase all connections to this entity.':
    'Changing the type will erase all relationships to this entity.',
};

export default {
  delta: 101,

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
