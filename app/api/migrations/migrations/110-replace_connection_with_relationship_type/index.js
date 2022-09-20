export default {
  delta: 110,

  reindex: false,

  name: 'replace_connection_with_relationship_type',

  description:
    'Replaces the context type from the obsolete `connection` term to the new `relationship type`',

  async up(db) {
    const cursor = await db.collection('translations').find({});

    // eslint-disable-next-line no-await-in-loop
    while (await cursor.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      const translation = await cursor.next();
      const newContexts = [];
      translation.contexts.forEach(context => {
        const newContext = context;
        if (context.type === 'Connection') {
          newContext.type = 'Relationship Type';
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
