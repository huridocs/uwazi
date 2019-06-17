import model from './activitylogModel';

const prepareRegexpQueries = (query) => {
  const result = {};
  if (query.url) {
    result.url = new RegExp(query.url);
  }

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

const timeQuery = (query) => {
  if (!query.time) {
    return {};
  }

  const result = { time: {} };
  if (query.time.from) {
    result.time.$gt = new Date(parseInt(query.time.from, 10) * 1000);
  }

  if (query.time.to) {
    result.time.$lt = new Date(parseInt(query.time.to, 10) * 1000);
  }
  return result;
};

export default {
  save(entry) {
    return model.save(entry);
  },

  get(query = {}) {
    const mongoQuery = Object.assign(prepareRegexpQueries(query), timeQuery(query));
    if (query.method && query.method.length) {
      mongoQuery.method = { $in: query.method };
    }

    if (query.username) {
      mongoQuery.username = query.username;
    }

    const pagination = { limit: parseInt(query.limit || 2000, 10), sort: { time: -1 } };
    return model.get(mongoQuery, null, pagination);
  }
};
