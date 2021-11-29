import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXSuggestionsFilter } from 'shared/types/suggestionType';

export const Suggestions = {
  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { state, ...filters } = filter;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [
        { $match: { ...filters } },
        {
          $lookup: {
            from: 'entities',
            localField: 'entityId',
            foreignField: 'sharedId',
            as: 'entity',
          },
        },
        {
          $match: { 'entity.language': 'en' },
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
        { $sort: { creationDate: 1, state: -1 } },
        {
          $project: {
            entityTitle: '$entity.title',
            language: 1,
            propertyName: 1,
            suggestedValue: 1,
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
};
