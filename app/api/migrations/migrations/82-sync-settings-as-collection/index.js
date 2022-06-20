export default {
  delta: 82,

  name: 'sync-settings-as-collection',

  description:
    'Make sync settings consistent between instances. Old instances can have sync settings defined as an object while others are defined as an array',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const [settings] = await db.collection('settings').find({}).toArray();

    if (!settings.sync || Array.isArray(settings.sync)) return;

    await db.collection('settings').updateOne({}, { $set: { sync: [settings.sync] } });
  },
};
