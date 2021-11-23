import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';

export const Suggestions = {
  get: async (filter: {}, options?: { size: number; page: number }) => {
    const offset = options && options.page ? options.size * (options.page - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options?.size || DEFAULT_LIMIT;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [{ $match: { ...filter } }, { $sort: { creationDate: 1 } }],
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
