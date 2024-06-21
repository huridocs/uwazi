import { sortingParams } from 'shared/types/activityLogApiSchemas';
import model from './activitylogModel';
import { getSemanticData } from './activitylogParser';
import { ActivityLogFilter } from './activityLogFilter';

const sortingParamsAsSet = new Set(sortingParams);

const isValidSortingParam = param => sortingParamsAsSet.has(param);

const validateSortingParam = param => {
  if (!isValidSortingParam(param)) {
    throw new Error(`Invalid sorting parameter: ${param}`);
  }
};

const getPagination = query => {
  const { page } = query;
  const limit = parseInt(query.limit || 15, 10);
  const paginationOptions = { limit };
  if (page) {
    paginationOptions.skip = (page - 1) * limit;
  }
  return paginationOptions;
};

const getSort = query => {
  const { sort } = query;
  const prop = sort?.prop || 'time';
  const asc = !!sort?.asc || false;
  validateSortingParam(prop);
  const sortOptions = { sort: {}, collation: { locale: 'en', strength: 2 } };
  sortOptions.sort[prop] = asc ? 1 : -1;
  if (prop !== 'time') {
    sortOptions.sort.time = -1;
  }
  return sortOptions;
};

const getOptions = query => ({
  ...getPagination(query),
  ...getSort(query),
});

export default {
  save(entry) {
    return model.save(entry);
  },

  sortingParams,

  isValidSortingParam,

  async get(query = {}) {
    const mongoQuery = new ActivityLogFilter(query).prepareQuery();
    if (query.username) {
      mongoQuery.username =
        query.username !== 'anonymous' ? query.username : { $in: [null, query.username] };
    }

    const optionsQuery = getOptions(query);

    const totalRows = await model.count(mongoQuery);
    const dbResults = await model.get(mongoQuery, null, optionsQuery);

    const semanticResults = await dbResults.reduce(async (prev, logEntry) => {
      const results = await prev;
      const semantic = await getSemanticData(logEntry);
      return results.concat([{ ...logEntry, semantic }]);
    }, Promise.resolve([]));

    return {
      rows: semanticResults,
      remainingRows: Math.max(0, totalRows - dbResults.length - (optionsQuery.skip || 0)),
      limit: optionsQuery.limit,
      page: query.page,
      totalRows,
    };
  },
};
