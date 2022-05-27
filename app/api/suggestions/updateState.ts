/* eslint-disable max-lines */
import settings from 'api/settings';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { AggregationCursor } from 'mongoose';
import { IXSuggestionsModel } from './IXSuggestionsModel';

interface StateResult {
  _id: any;
  state: string;
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
const recalculateStates = (query: any, languages: any[]): AggregationCursor => {
  const defaultLanguage = languages.find(l => l.default)!.key;
  const configuredLanguages = languages.map(l => l.key);
  return IXSuggestionsModel.db
    .aggregateCursor<StateResult[]>([
      { $match: { ...query, status: 'ready' } },
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
                  then: SuggestionState.error,
                },
                {
                  case: {
                    $lte: ['$date', '$modelCreationDate'],
                  },
                  then: SuggestionState.obsolete,
                },
                {
                  case: {
                    $and: [
                      { $lte: ['$labeledValue', null] },
                      { $eq: ['$suggestedValue', ''] },
                      { $ne: ['$currentValue', ''] },
                    ],
                  },
                  then: SuggestionState.valueEmpty,
                },
                {
                  case: {
                    $and: [
                      { $eq: ['$suggestedValue', '$currentValue'] },
                      { $eq: ['$suggestedValue', '$labeledValue'] },
                    ],
                  },
                  then: SuggestionState.labelMatch,
                },
                {
                  case: {
                    $and: [{ $eq: ['$currentValue', ''] }, { $eq: ['$suggestedValue', ''] }],
                  },
                  then: SuggestionState.empty,
                },
                {
                  case: {
                    $and: [
                      { $eq: ['$labeledValue', '$currentValue'] },
                      { $ne: ['$labeledValue', '$suggestedValue'] },
                      { $eq: ['$suggestedValue', ''] },
                    ],
                  },
                  then: SuggestionState.labelEmpty,
                },
                {
                  case: {
                    $and: [
                      { $eq: ['$labeledValue', '$currentValue'] },
                      { $ne: ['$labeledValue', '$suggestedValue'] },
                    ],
                  },
                  then: SuggestionState.labelMismatch,
                },
                {
                  case: {
                    $and: [{ $eq: ['$suggestedValue', '$currentValue'] }],
                  },
                  then: SuggestionState.valueMatch,
                },
              ],
              default: SuggestionState.valueMismatch,
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
    ])
    .cursor()
    .exec();
};

export const updateStates = async (query: any) => {
  const { languages } = await settings.get();
  const cursor = recalculateStates(query, languages || []);
  let state;
  // eslint-disable-next-line no-cond-assign
  // eslint-disable-next-line no-await-in-loop
  while ((state = await cursor.next())) {
    // eslint-disable-next-line no-await-in-loop
    await IXSuggestionsModel.db.updateOne({ _id: state._id }, { $set: { state: state.state } });
  }
};
