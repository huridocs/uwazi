/* eslint-disable max-lines */
// eslint-disable-next-line @typescript-eslint/promise-function-async
const recalculateStates = (db, query, languages) => {
  const defaultLanguage = languages.find(l => l.default).key;
  const configuredLanguages = languages.map(l => l.key);
  return db.collection('ixsuggestions').aggregate([
    { $match: { ...query } },
    {
      $lookup: {
        from: 'entities',
        let: {
          localFieldEntityId: '$entityId',
          localFieldLanguage: {
            $cond: [
              {
                $not: [{ $in: ['$language', configuredLanguages] }],
              },
              defaultLanguage,
              '$language',
            ],
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$sharedId', '$$localFieldEntityId'] },
                  { $eq: ['$language', '$$localFieldLanguage'] },
                ],
              },
            },
          },
        ],
        as: 'entity',
      },
    },
    {
      $addFields: { entity: { $arrayElemAt: ['$entity', 0] } },
    },
    {
      $addFields: {
        currentValue: {
          $cond: [
            { $eq: ['$propertyName', 'title'] },
            { v: [{ value: '$entity.title' }] },
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: {
                      $objectToArray: '$entity.metadata',
                    },
                    as: 'property',
                    cond: {
                      $eq: ['$$property.k', '$propertyName'],
                    },
                  },
                },
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        currentValue: { $arrayElemAt: ['$currentValue.v', 0] },
      },
    },
    {
      $addFields: {
        currentValue: { $ifNull: ['$currentValue.value', ''] },
      },
    },
    {
      $unset: 'entity',
    },
    {
      $lookup: {
        from: 'files',
        let: {
          localFieldFileId: '$fileId',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$localFieldFileId'],
              },
            },
          },
        ],
        as: 'file',
      },
    },
    {
      $addFields: { file: { $arrayElemAt: ['$file', 0] } },
    },
    {
      $addFields: {
        labeledValue: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$file.extractedMetadata',
                as: 'label',
                cond: {
                  $eq: ['$propertyName', '$$label.name'],
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        labeledValue: '$labeledValue.selection.text',
      },
    },
    {
      $unset: 'file',
    },
    {
      $lookup: {
        from: 'ixmodels',
        let: {
          localFieldPropertyName: '$propertyName',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$propertyName', '$$localFieldPropertyName'],
              },
            },
          },
        ],
        as: 'model',
      },
    },
    {
      $addFields: { model: { $arrayElemAt: ['$model', 0] } },
    },
    {
      $addFields: {
        modelCreationDate: '$model.creationDate',
      },
    },
    {
      $unset: 'model',
    },
    {
      $addFields: {
        state: {
          $switch: {
            branches: [
              {
                case: {
                  $ne: ['$error', ''],
                },
                then: 'Error',
              },
              {
                case: {
                  $lte: ['$date', '$modelCreationDate'],
                },
                then: 'Obsolete',
              },
              {
                case: {
                  $and: [
                    { $lte: ['$labeledValue', null] },
                    { $eq: ['$suggestedValue', ''] },
                    { $ne: ['$currentValue', ''] },
                  ],
                },
                then: 'Empty / Value',
              },
              {
                case: {
                  $and: [
                    { $eq: ['$suggestedValue', '$currentValue'] },
                    { $eq: ['$suggestedValue', '$labeledValue'] },
                  ],
                },
                then: 'Match / Label',
              },
              {
                case: {
                  $and: [{ $eq: ['$currentValue', ''] }, { $eq: ['$suggestedValue', ''] }],
                },
                then: 'Empty / Empty',
              },
              {
                case: {
                  $and: [
                    { $eq: ['$labeledValue', '$currentValue'] },
                    { $ne: ['$labeledValue', '$suggestedValue'] },
                    { $eq: ['$suggestedValue', ''] },
                  ],
                },
                then: 'Empty / Label',
              },
              {
                case: {
                  $and: [
                    { $eq: ['$labeledValue', '$currentValue'] },
                    { $ne: ['$labeledValue', '$suggestedValue'] },
                  ],
                },
                then: 'Mismatch / Label',
              },
              {
                case: {
                  $and: [{ $eq: ['$suggestedValue', '$currentValue'] }],
                },
                then: 'Match / Value',
              },
            ],
            default: 'Mismatch / Value',
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        state: 1,
      },
    },
  ]);
};

export const updateStates = async (db, query, progressCallback) => {
  const { languages } = await db.collection('settings').find({}).next();
  const cursor = recalculateStates(db, query, languages || []);
  let state;
  // eslint-disable-next-line no-await-in-loop, no-cond-assign
  while ((state = await cursor.next())) {
    // eslint-disable-next-line no-await-in-loop
    await db
      .collection('ixsuggestions')
      .updateOne({ _id: state._id }, { $set: { state: state.state } });

    progressCallback();
  }
};
