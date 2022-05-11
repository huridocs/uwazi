/* eslint-disable no-await-in-loop */
export default {
  delta: 76,

  name: 'remove-duplicate-translation-keys',

  description: `The migration makes sure that there are no multiples of the same key in a context. 
  It picks the first key-value pair, where the value differs from the key, if there is any.`,

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const translations = await db.collection('translations').find();

    while (await translations.hasNext()) {
      const tr = await translations.next();
      const newContexts = tr.contexts.map(context => {
        const newValues = {};
        context.values.forEach(({ key, value }) => {
          if (!(key in newValues) || (key !== value && key === newValues[key])) {
            newValues[key] = value;
          }
        });
        const newValueArray = Object.entries(newValues).map(([key, value]) => ({ key, value }));
        if (newValueArray.length !== context.values.length) {
          this.reindex = true;
        }
        return {
          ...context,
          values: newValueArray,
        };
      });
      await db
        .collection('translations')
        .updateOne({ _id: tr._id }, { $set: { contexts: newContexts } });
    }
  },
};
