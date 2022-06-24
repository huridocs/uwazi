import { AggregationCursor } from 'mongoose';

import settings from 'api/settings';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { IXSuggestionsModel } from './IXSuggestionsModel';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
} from './pipelineStages';

const getModelCreationDateStage = () => [
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
];

const getCalculateStateStage = () => [
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
                $eq: ['$suggestedValue', '$currentValue'],
              },
              then: SuggestionState.valueMatch,
            },
          ],
          default: SuggestionState.valueMismatch,
        },
      },
    },
  },
];

interface StateResult {
  _id: any;
  state: string;
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
const recalculateStates = (query: any, languages: LanguagesListSchema): AggregationCursor =>
  IXSuggestionsModel.db
    .aggregateCursor<StateResult[]>([
      { $match: { ...query, status: { $ne: 'processing' } } },
      ...getEntityStage(languages),
      ...getCurrentValueStage(),
      {
        $unset: 'entity',
      },
      ...getFileStage(),
      ...getLabeledValueStage(),
      {
        $unset: 'file',
      },
      ...getModelCreationDateStage(),
      ...getCalculateStateStage(),
      {
        $project: {
          _id: 1,
          state: 1,
        },
      },
    ])
    .cursor()
    .exec();

export const updateStates = async (query: any) => {
  const { languages } = await settings.get();
  const cursor = recalculateStates(query, languages || []);
  let state;
  const writeStream = IXSuggestionsModel.openBulkWriteStream();
  // eslint-disable-next-line no-await-in-loop, no-cond-assign
  while ((state = await cursor.next())) {
    // eslint-disable-next-line no-await-in-loop
    await writeStream.update({ _id: state._id }, { $set: { state: state.state } });
  }
  await writeStream.flush();
};
