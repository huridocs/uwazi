/* eslint-disable no-await-in-loop */
export default {
  delta: 34,

  name: 'move-attachments',

  description: 'Attachments moving from entity to the files collection',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = db.collection('entities').find({});
    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      await Promise.all(
        entity.attachments.map(async ({ filename, originalname }) =>
          db.collection('files').updateMany(
            { filename },
            {
              $set: {
                entity: entity.sharedId,
                filename,
                originalname,
                type: 'attachment',
              },
            },
            { upsert: true }
          )
        )
      );

      process.stdout.write(`-> processed: ${index} \r`);
      index += 1;
    }
    await db.collection('entities').updateMany({}, { $unset: { attachments: 1 } }, { multi: true });
    process.stdout.write('\r\n');
  },
};
