/* eslint-disable no-await-in-loop */
export default {
  delta: 15,

  name: 'remove_orphan_relations',

  description: 'remove relationships to entities that no longer exist',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 0;

    const cursor = db.collection('connections').find();
    while (await cursor.hasNext()) {
      const connection = await cursor.next();

      const nonExistent =
        (await db.collection('entities').find({ sharedId: connection.entity }).toArray()).length ===
        0;

      if (nonExistent) {
        await db.collection('connections').deleteOne({ _id: connection._id });
        index += 1;
      }
    }
    process.stdout.write(`deleted orphan entities -> ${index}\r`);
    process.stdout.write('\r\n');
  },
};
