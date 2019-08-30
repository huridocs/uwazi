import model from './activitylogModel';
import { getSemanticData } from './activitylogParser';

const prepareRegexpQueries = (query) => {
  const result = {};

  result.url = query.url ? new RegExp(query.url) : { $ne: '/api/semantic-search/notify-updates' };

  if (query.query) {
    result.query = new RegExp(query.query);
  }

  if (query.body) {
    result.body = new RegExp(query.body);
  }

  if (query.params) {
    result.params = new RegExp(query.params);
  }

  return result;
};

const prepareQuery = (query) => {
  if (!query.find) {
    return prepareRegexpQueries(query);
  }
  const term = new RegExp(query.find);
  return { $or: [{ method: term }, { url: term }, { query: term }, { body: term }, { params: term }, { username: term }] };
};

const timeQuery = ({ time = {} }) => {
  const sanitizedTime = Object.keys(time).reduce((memo, k) => time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo, {});
  if (!Object.keys(sanitizedTime).length) {
    return {};
  }

  const result = { time: {} };
  if (sanitizedTime.from) {
    result.time.$gt = parseInt(sanitizedTime.from, 10) * 1000;
  }

  if (sanitizedTime.to) {
    result.time.$lt = parseInt(sanitizedTime.to, 10) * 1000;
  }

  return result;
};

const getPagination = (query) => {
  const limit = parseInt(query.limit || 30, 10);
  const page = query.page ? parseInt(query.page, 10) - 1 : 0;
  const skip = page * limit;

  return { limit, skip, sort: { time: -1 } };
};

export default {
  save(entry) {
    return model.save(entry);
  },

  async get(query = {}) {
    const mongoQuery = Object.assign(prepareQuery(query), timeQuery(query));

    if (query.method && query.method.length) {
      mongoQuery.method = { $in: query.method };
    }

    if (query.username) {
      mongoQuery.username = query.username;
    }

    const pagination = getPagination(query);

    const totalRows = await model.count(mongoQuery);
    const dbResults = await model.get(mongoQuery, null, pagination);

    const semanticResults = await dbResults.reduce(async (prev, logEntry) => {
      const results = await prev;
      const semantic = await getSemanticData(logEntry);
      return results.concat([{ ...logEntry, semantic }]);
    }, Promise.resolve([]));

    return { rows: semanticResults, totalRows, pageSize: pagination.limit, page: parseInt((pagination.skip / pagination.limit) + 1, 10) };
  }
};
