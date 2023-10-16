export default {
  delta: 146,

  name: 'remove_translationsv2_traces',

  description: 'remove translations collection and translations updatelogs',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('translations').drop();
    await db.collection('updatelogs').deleteMany({ namespace: 'translations' });
  },
};
