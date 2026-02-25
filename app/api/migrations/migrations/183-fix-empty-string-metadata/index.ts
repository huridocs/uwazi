import { Db } from 'mongodb';

export default {
  delta: 183,

  name: 'fix-empty-string-metadata',

  description:
    'Removes metadata value entries where value is an empty string. Empty values must be represented as [] not [{ value: "" }].',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const result = await db.collection('entities').updateMany({ metadata: { $exists: true } }, [
      {
        $set: {
          metadata: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: '$metadata' },
                as: 'prop',
                in: {
                  k: '$$prop.k',
                  v: {
                    $filter: {
                      input: '$$prop.v',
                      as: 'item',
                      cond: { $ne: ['$$item.value', ''] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    this.reindex = result.modifiedCount > 0;
  },
};
