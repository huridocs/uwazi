export default {
  delta: 43,

  name: 'change-system-translation-label',

  description: 'Changes all translation contexts with system label to user Interface',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db
      .collection('translations')
      .updateMany({ 'contexts.id': 'System' }, { $set: { 'contexts.$.label': 'User Interface' } });
  },
};
