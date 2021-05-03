/* eslint-disable no-await-in-loop */
export default {
  delta: 39,

  name: 'remove_wrong_text_references',

  description: 'remove wrongly created text references and log them',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await db
      .collection('connections')
      .updateMany(
        { 'reference.text': { $exists: false }, 'reference.selectionRectangles': { $size: 0 } },
        { $unset: { reference: '' } }
      );

    const cursor = await db
      .collection('connections')
      .find({ 'reference.text': { $exists: true }, 'reference.selectionRectangles': { $size: 0 } });

    while (await cursor.hasNext()) {
      const connection = await cursor.next();

      const connectionsOnHub = await db
        .collection('connections')
        .find({ hub: connection.hub })
        .toArray();

      if (connectionsOnHub.length === 2) {
        await db
          .collection('connections')
          .deleteMany({ _id: { $in: connectionsOnHub.map(c => c._id) } });

        connectionsOnHub.forEach(c => {
          process.stdout.write(JSON.stringify(c, null, ' '));
          process.stdout.write('\r\n');
        });
      } else {
        await db.collection('connections').deleteOne(connection);
        process.stdout.write(JSON.stringify(connection, null, ' '));
        process.stdout.write('\r\n');
      }
    }
  },
};
