import { AggregationCursor } from 'mongoose';

import settings from 'api/settings';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { IXSuggestionsModel } from './IXSuggestionsModel';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
} from './pipelineStages';
import { getSuggestionState, SuggestionValues } from './getSuggestionState';

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

// eslint-disable-next-line @typescript-eslint/promise-function-async
const findSuggestions = (query: any, languages: LanguagesListSchema): AggregationCursor =>
  IXSuggestionsModel.db
    .aggregateCursor<SuggestionValues[]>([
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
      {
        $project: {
          _id: 1,
          currentValue: 1,
          labeledValue: 1,
          suggestedValue: 1,
          modelCreationDate: 1,
          error: 1,
          date: 1,
        },
      },
    ])
    .cursor()
    .exec();

export const updateStates = async (query: any) => {
  const { languages } = await settings.get();
  const cursor = findSuggestions(query, languages || []);
  let suggestion;
  const writeStream = IXSuggestionsModel.openBulkWriteStream();
  // eslint-disable-next-line no-await-in-loop, no-cond-assign
  while ((suggestion = await cursor.next())) {
    // eslint-disable-next-line no-await-in-loop
    await writeStream.update(
      { _id: suggestion._id },
      { $set: { state: getSuggestionState(suggestion) } }
    );
  }
  await writeStream.flush();
};
