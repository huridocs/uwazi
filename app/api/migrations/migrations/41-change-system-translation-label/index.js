export default {
  delta: 41,

  name: 'change-system-translation-label',

  description: 'Changes all translation contexts with system label to user Interface',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const translations = await db
      .collection('translations')
      .find({})
      .toArray();

    translations.forEach(async trans => {
      const context = trans.contexts.find(ctxt => ctxt.id === 'System');
      if (context) {
        context.label = 'User Interface';

        await db.collection('translations').updateOne({ _id: trans._id }, { $set: { ...trans } });
      }
    });
  },
};
