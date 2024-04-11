import settings from 'api/settings';
import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { getSuggestionState, SuggestionValues } from 'shared/getIXSuggestionState';
import { LanguagesListSchema, PropertyTypeSchema } from 'shared/types/commonTypes';
import { IXSuggestionsModel } from './IXSuggestionsModel';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
} from './pipelineStages';
import { propertyIsMultiselect } from 'shared/propertyTypes';

type SuggestionsAggregationResult = SuggestionValues & { _id: any; propertyName: string };

const getModelCreationDateStage = () => [
  {
    $lookup: {
      from: 'ixmodels',
      let: {
        localFieldExtractorId: '$extractorId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$extractorId', '$$localFieldExtractorId'],
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

const findSuggestions = (query: any, languages: LanguagesListSchema) =>
  IXSuggestionsModel.db
    .aggregateCursor<SuggestionsAggregationResult[]>([
      { $match: { ...query } },
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
          labeledText: 1,
          suggestedValue: 1,
          modelCreationDate: 1,
          error: 1,
          date: 1,
          propertyName: 1,
          extractorId: 1,
          status: 1,
          state: 1,
          segment: 1,
        },
      },
    ])
    .cursor();

const postProcessCurrentValue = (
  suggestion: SuggestionsAggregationResult,
  propertyType: PropertyTypeSchema
) => {
  if (propertyIsMultiselect(propertyType)) return suggestion;
  return {
    ...suggestion,
    currentValue: suggestion.currentValue.length > 0 ? suggestion.currentValue[0] : '',
  };
};

export const updateStates = async (query: any) => {
  const { languages } = await settings.get();
  const propertyTypes = objectIndex(
    (await templates.get({})).map(t => t.properties || []).flat(),
    p => p.name,
    p => p.type
  );
  const cursor = findSuggestions(query, languages || []);
  const writeStream = IXSuggestionsModel.openBulkWriteStream();
  let suggestion: SuggestionsAggregationResult = await cursor.next();
  while (suggestion) {
    const propertyType = propertyTypes[suggestion.propertyName];
    const _suggestion = postProcessCurrentValue(suggestion, propertyType);
    // eslint-disable-next-line no-await-in-loop
    await writeStream.update(
      { _id: _suggestion._id },
      { $set: { state: getSuggestionState(_suggestion, propertyType) } }
    );
    // eslint-disable-next-line no-await-in-loop
    suggestion = await cursor.next();
  }
  await writeStream.flush();
};
