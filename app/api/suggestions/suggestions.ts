import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { EntitySuggestionType, IXSuggestionsFilter } from 'shared/types/suggestionType';
import entities from 'api/entities/entities';
import { EntitySchema } from 'shared/types/entityType';

export const Suggestions = {
  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { state, language, ...filters } = filter;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [
        { $match: { ...filters } },
        {
          $lookup: {
            from: 'entities',
            let: {
              localField: '$entityId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$sharedId', '$$localField'] },
                      { $eq: ['$language', language] },
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
          $addFields: {
            state: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$suggestedValue', '$currentValue'] },
                    then: 'Matching',
                  },
                  {
                    case: {
                      $eq: ['$currentValue', ''],
                    },
                    then: 'Empty',
                  },
                ],
                default: 'Pending',
              },
            },
          },
        },
        ...(state ? [{ $match: { $expr: { $eq: ['$state', state] } } }] : []),
        { $sort: { date: 1, state: -1 } },
        {
          $project: {
            entityId: '$entity._id',
            sharedId: '$entity.sharedId',
            entityTitle: '$entity.title',
            language: 1,
            propertyName: 1,
            suggestedValue: 1,
            segment: 1,
            currentValue: 1,
            state: 1,
          },
        },
      ],
      {
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [{ $skip: offset }, { $limit: limit }],
      },
      { count: '$stage1.count', data: '$stage2' }
    );

    const totalPages = Math.ceil(count[0] / limit);
    return { suggestions: data, totalPages };
  },
  accept: async (suggestion: EntitySuggestionType, allLanguages: boolean) => {
    const query = allLanguages
      ? { sharedId: suggestion.sharedId.toString() }
      : { _id: suggestion._id };
    const entitiesToUpdate = await entities.get(query, '+permissions');
    const pureValues = {};
    const diffMetadata = {};
    if (suggestion.propertyName !== 'title') {
      await Promise.all(
        entitiesToUpdate.map(async (entity: EntitySchema) =>
          entities.saveEntityMetadata(entity, pureValues, diffMetadata)
        )
      );
    } else {
      await Promise.all(
        entitiesToUpdate.map(async (entity: EntitySchema) => entities.save(entity))
      );
    }
  },
};
