/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

const entryNeedsIconIdRewrite = {
  $and: [
    { $eq: [{ $type: '$$entry' }, 'object'] },
    { $eq: [{ $type: '$$entry.icon' }, 'object'] },
    { $ne: [{ $type: '$$entry.icon.id' }, 'missing'] },
  ],
};

const rewriteIconIdToUnderscoreId = {
  $let: {
    vars: {
      iconFields: { $objectToArray: '$$entry.icon' },
    },
    in: {
      $arrayToObject: {
        $concatArrays: [
          {
            $filter: {
              input: '$$iconFields',
              as: 'iconField',
              cond: { $not: { $in: ['$$iconField.k', ['id', '_id']] } },
            },
          },
          [{ k: '_id', v: '$$entry.icon.id' }],
        ],
      },
    },
  },
};

export default {
  delta: 189,

  name: 'repair_denormalized_icon_id_in_metadata',

  description:
    'Repairs denormalized metadata entries that store icon.id instead of icon._id by rewriting icon objects in metadata arrays.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const result = await db.collection('entities').updateMany(
      {
        metadata: { $exists: true, $type: 'object' },
        $expr: {
          $anyElementTrue: {
            $map: {
              input: { $objectToArray: '$metadata' },
              as: 'prop',
              in: {
                $and: [
                  { $isArray: '$$prop.v' },
                  {
                    $anyElementTrue: {
                      $map: {
                        input: '$$prop.v',
                        as: 'entry',
                        in: entryNeedsIconIdRewrite,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      [
        {
          $set: {
            metadata: {
              $let: {
                vars: {
                  metadataFields: { $objectToArray: '$metadata' },
                },
                in: {
                  $arrayToObject: {
                    $map: {
                      input: '$$metadataFields',
                      as: 'prop',
                      in: {
                        k: '$$prop.k',
                        v: {
                          $cond: {
                            if: { $isArray: '$$prop.v' },
                            then: {
                              $map: {
                                input: '$$prop.v',
                                as: 'entry',
                                in: {
                                  $cond: {
                                    if: entryNeedsIconIdRewrite,
                                    then: {
                                      $mergeObjects: [
                                        '$$entry',
                                        { icon: rewriteIconIdToUnderscoreId },
                                      ],
                                    },
                                    else: '$$entry',
                                  },
                                },
                              },
                            },
                            else: '$$prop.v',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]
    );

    this.reindex = result.modifiedCount > 0;
  },
};
