/* eslint-disable no-await-in-loop, max-statements */
export default {
  delta: 22,

  name: 'files-to-updatelogs',

  description: 'update previously migrated files to updatelogs',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = db.collection('files').find({});

    let index = 1;

    const [sync] = await db.collection('syncs').find().toArray();

    while (await cursor.hasNext()) {
      const file = await cursor.next();
      const logExists = (await db.collection('updatelogs').find({ mongoId: file._id }).toArray())
        .length;

      if (!logExists) {
        await db.collection('updatelogs').insertOne({
          timestamp: sync ? sync.lastSync : 0,
          namespace: 'files',
          mongoId: file._id,
          deleted: false,
        });
      }
      process.stdout.write(` -> processed: ${index} \r`);
      index += 1;
    }
  },
};
