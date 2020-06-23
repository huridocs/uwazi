/* eslint-disable no-await-in-loop */
export default {
  delta: 26,

  name: 'fix_blank_values',

  description: 'fix values on metadata that are blank strings instead of empty array',

  async up(db) {
    const cursor = db.collection('entities').find({});
    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      const metadata = Object.keys(entity.metadata || {}).reduce((newMetadata, propName) => {
        if (entity.metadata[propName] === '') {
          //eslint-disable-next-line no-param-reassign
          newMetadata[propName] = [];
        } else {
          //eslint-disable-next-line no-param-reassign
          newMetadata[propName] = entity.metadata[propName];
        }
        return newMetadata;
      }, {});

      await db.collection('entities').updateOne({ _id: entity._id }, { $set: { metadata } });

      process.stdout.write(`-> processed: ${index} \r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
