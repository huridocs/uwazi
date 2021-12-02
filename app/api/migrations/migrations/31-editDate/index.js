export default {
  delta: 31,

  name: 'editDate',

  description: 'Adds editDate property on all entities',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = await db.collection('entities').find({});

    // eslint-disable-next-line no-await-in-loop
    while (await cursor.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      const entity = await cursor.next();
      // eslint-disable-next-line no-await-in-loop
      let time = entity.creationDate; //entity.creationDate;

      // eslint-disable-next-line no-await-in-loop
      const logs = await db.collection('updatelogs').find({ mongoId: entity._id }).toArray();

      if (logs.length) {
        time = logs[0].timestamp;
      }
      // eslint-disable-next-line no-await-in-loop
      await db.collection('entities').updateOne({ _id: entity._id }, { $set: { editDate: time } });
    }
  },
};
