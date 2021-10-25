export default {
  delta: 55,

  name: 'replace_dictionary_with_thesaurus',

  description: 'Replaces dictionary translation types  with thesaurus in translations',

  async up(db) {
    const cursor = await db.collection('translations').find({});

    // eslint-disable-next-line no-await-in-loop
    while (await cursor.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      const translation = await cursor.next();
      const newContexts = [];
      translation.contexts.forEach(context => {
        const newContext = context;
        if (context.type === 'Dictionary') {
          newContext.type = 'Thesaurus';
        }
        newContexts.push(newContext);
      });

      // eslint-disable-next-line no-await-in-loop
      await db
        .collection('translations')
        .updateOne({ _id: translation._id }, { $set: { contexts: newContexts } });
    }
    process.stdout.write(`${this.name}...\r\n`);
  },
};
