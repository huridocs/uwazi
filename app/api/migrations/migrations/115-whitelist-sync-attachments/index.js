export default {
  delta: 115,

  name: 'whitelist-sync-attachments',

  description: 'Adds the attachments whitelisting flag to existing sync configurations',

  reindex: false,

  async up(db) {
    const [{ sync }] = await db.collection('settings').find().toArray();
    if (!sync) return;

    sync.forEach(aSync => {
      Object.values(aSync.config.templates).forEach(config => {
        config.attachments = true;
      });
    });

    await db.collection('settings').updateOne({}, { $set: { sync } });
  },
};
