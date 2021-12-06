export default {
  delta: 30,

  name: 'multiple-sync',

  description: 'Nests current sycn configurations inside arrays and names them',

  async up(db) {
    process.stdout.write('Updating sync configurations...\r\n');

    const [settings] = await db.collection('settings').find().toArray();

    if (settings.sync) {
      const sync = [{ ...settings.sync, name: 'default' }];
      await db.collection('settings').updateOne({ _id: settings._id }, { $set: { sync } });
    }

    const syncs = await db.collection('syncs').find().toArray();

    if (syncs.length) {
      await db.collection('syncs').updateOne({ _id: syncs[0]._id }, { $set: { name: 'default' } });
    }

    process.stdout.write('Sync configurations updated\r\n');
  },
};
