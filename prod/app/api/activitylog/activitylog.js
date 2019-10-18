"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _activitylogModel = _interopRequireDefault(require("./activitylogModel"));
var _activitylogParser = require("./activitylogParser");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const prepareRegexpQueries = query => {
  const result = {};

  result.url = query.url ? new RegExp(query.url) : { $ne: '/api/semantic-search/notify-updates' };

  if (query.query) {result.query = new RegExp(query.query);}
  if (query.body) {result.body = new RegExp(query.body);}
  if (query.params) {result.params = new RegExp(query.params);}

  return result;
};

const prepareQuery = query => {
  if (!query.find) {
    return prepareRegexpQueries(query);
  }
  const term = new RegExp(query.find);
  return { $or: [{ method: term }, { url: term }, { query: term }, { body: term }, { params: term }] };
};

const prepareToFromRanges = sanitizedTime => {
  const time = {};

  if (sanitizedTime.from) {
    time.$gte = parseInt(sanitizedTime.from, 10) * 1000;
  }

  if (sanitizedTime.to) {
    time.$lte = parseInt(sanitizedTime.to, 10) * 1000;
  }

  return time;
};

const timeQuery = ({ time = {}, before = null }) => {
  const sanitizedTime = Object.keys(time).reduce((memo, k) => time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo, {});

  if (before === null && !Object.keys(sanitizedTime).length) {
    return {};
  }

  const result = { time: prepareToFromRanges(sanitizedTime) };

  if (before !== null) {
    result.time.$lt = parseInt(before, 10);
  }

  return result;
};

const getLimit = query => {
  const limit = parseInt(query.limit || 15, 10);
  return { limit, sort: { time: -1 } };
};var _default =

{
  save(entry) {
    return _activitylogModel.default.save(entry);
  },

  async get(query = {}) {
    const mongoQuery = Object.assign(prepareQuery(query), timeQuery(query));

    if (query.method && query.method.length) {
      mongoQuery.method = { $in: query.method };
    }

    if (query.username) {
      mongoQuery.username = query.username;
    }

    const limitQuery = getLimit(query);

    const totalRows = await _activitylogModel.default.count(mongoQuery);
    const dbResults = await _activitylogModel.default.get(mongoQuery, null, limitQuery);

    const semanticResults = await dbResults.reduce(async (prev, logEntry) => {
      const results = await prev;
      const semantic = await (0, _activitylogParser.getSemanticData)(logEntry);
      return results.concat([_objectSpread({}, logEntry, { semantic })]);
    }, Promise.resolve([]));

    return { rows: semanticResults, remainingRows: totalRows - dbResults.length, limit: limitQuery.limit };
  } };exports.default = _default;