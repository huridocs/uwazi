/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

export default {
  delta: 194,

  name: 'rename-extracted-metadata-to-property-selections',

  description:
    'Moves files.extractedMetadata to files.propertySelections, merging safely, and removes legacy field.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const migrateResult = await db.collection('files').updateMany(
      {
        extractedMetadata: { $type: 'array' },
      },
      [
        {
          $set: {
            propertySelections: {
              $cond: [
                { $eq: [{ $type: '$propertySelections' }, 'missing'] },
                '$extractedMetadata',
                {
                  $cond: [
                    { $isArray: '$propertySelections' },
                    {
                      $concatArrays: [
                        '$propertySelections',
                        {
                          $filter: {
                            input: '$extractedMetadata',
                            as: 'legacySelection',
                            cond: {
                              $or: [
                                { $ne: [{ $type: '$$legacySelection.name' }, 'string'] },
                                {
                                  $not: {
                                    $in: [
                                      '$$legacySelection.name',
                                      {
                                        $map: {
                                          input: '$propertySelections',
                                          as: 'currentSelection',
                                          in: '$$currentSelection.name',
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                    '$propertySelections',
                  ],
                },
              ],
            },
          },
        },
      ]
    );

    const unsetResult = await db
      .collection('files')
      .updateMany({ extractedMetadata: { $exists: true } }, { $unset: { extractedMetadata: '' } });

    process.stdout.write(
      `${this.name}: migrated ${migrateResult.modifiedCount} file(s), removed legacy field from ${unsetResult.modifiedCount} file(s).\r\n`
    );
  },
};
