import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';

export const Suggestions = {
  get: async (filter: {}, options: { size: number; page: number }) => {
    const offset = options.size * options.page;
    //[{ $sort: { propertyName: 1 } }],
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [{ $match: { ...filter } }],
      {
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [{ $skip: offset }, { $limit: options.size }],
      },
      { count: '$stage1.count', data: '$stage2' }
    );

    return { suggestions: data, totalPages: count };
  },
};
