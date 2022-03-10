/* eslint-disable no-await-in-loop */
import entities from 'api/entities/entities';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXSuggestionsFilter } from 'shared/types/suggestionType';
import { EntitySchema } from 'shared/types/entityType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

export const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),
  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { state, language, ...filters } = filter;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [
        { $match: { ...filters, status: 'ready' } },
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
            page: 1,
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
    allLanguages: boolean
  ) => {
    const suggestion = await IXSuggestionsModel.getById(acceptedSuggestion._id);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }
    const query = allLanguages
      ? { sharedId: acceptedSuggestion.sharedId }
      : { sharedId: acceptedSuggestion.sharedId, _id: acceptedSuggestion.entityId };
    const storedEntities = await entities.get(query, '+permissions');
    const entitiesToUpdate =
      suggestion.propertyName !== 'title'
        ? storedEntities.map((entity: EntitySchema) => ({
            ...entity,
            metadata: {
              ...entity.metadata,
              [suggestion.propertyName]: [{ value: suggestion.suggestedValue }],
            },
            permissions: entity.permissions || [],
          }))
        : storedEntities.map((entity: EntitySchema) => ({
            ...entity,
            title: suggestion.suggestedValue,
          }));
    await entities.saveMultiple(entitiesToUpdate);
  },
  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },
  deleteByProperty: async (propertyName: string, templateId: string) => {
    const cursor = IXSuggestionsModel.db.find({ propertyName }).cursor();

    for (let suggestion = await cursor.next(); suggestion; suggestion = await cursor.next()) {
      const sharedId = suggestion.entityId;
      // eslint-disable-next-line no-await-in-loop
      const [entity] = await entities.getUnrestricted({ sharedId });
      if (entity && entity.template?.toString() === templateId) {
        // eslint-disable-next-line no-await-in-loop
        await IXSuggestionsModel.delete({ _id: suggestion._id });
      }
    }
  },
};
