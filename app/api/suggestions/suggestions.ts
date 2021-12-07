import { IXSuggestionsFilter } from 'shared/types/suggestionType';
import { EntitySchema } from 'shared/types/entityType';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import entities from 'api/entities/entities';
import { ObjectIdSchema } from 'shared/types/commonTypes';

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

  accept: async (
    acceptedSuggestion: {
      _id: ObjectIdSchema;
      sharedId: string;
      entityId: string;
    },
    allLanguages: boolean,
    params: { user: {}; language: string }
  ) => {
    const suggestion = await IXSuggestionsModel.getById(acceptedSuggestion._id);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    const query = allLanguages
      ? { sharedId: acceptedSuggestion.sharedId }
      : { sharedId: acceptedSuggestion.sharedId, _id: acceptedSuggestion.entityId };
    const storedEntities = await entities.get(query, '+permissions');
    if (suggestion.propertyName !== 'title') {
      const entitiesToUpdate = storedEntities.map((entity: EntitySchema) => ({
        ...entity,
        metadata: {
          ...entity.metadata,
          [suggestion.propertyName]: [{ value: suggestion.suggestedValue }],
        },
        permissions: entity.permissions || [],
      }));
      await entities.saveMultiple(entitiesToUpdate);
    } else {
      const entitiesToUpdate = storedEntities.map((entity: EntitySchema) => ({
        ...entity,
        title: suggestion.suggestedValue,
      }));
      await Promise.all(
        entitiesToUpdate.map(async (entity: EntitySchema) => entities.save(entity, params))
      );
    }
  },
};
