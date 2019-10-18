"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.generateID = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _updatelogs = require("../updatelogs");

var _models = _interopRequireDefault(require("./models"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const generateID = _mongoose.default.Types.ObjectId;exports.generateID = generateID;var _default =


(collectionName, schema) => {
  const getAffectedIds = async conditions => _mongoose.default.models[collectionName].distinct('_id', conditions);

  const upsertLogOne = async (doc, next) => {
    const logData = { namespace: collectionName, mongoId: doc._id };
    await _updatelogs.model.findOneAndUpdate(logData, _objectSpread({}, logData, { timestamp: Date.now(), deleted: false }), { upsert: true, lean: true });
    next();
  };

  async function upsertLogMany(affectedIds, deleted = false) {
    await _updatelogs.model.updateMany(
    { mongoId: { $in: affectedIds }, namespace: collectionName },
    { $set: { timestamp: Date.now(), deleted } },
    { upsert: true, lean: true });

  }

  schema.post('save', upsertLogOne);
  schema.post('findOneAndUpdate', upsertLogOne);

  schema.post('updateMany', async function updateMany(doc, next) {
    const affectedIds = await getAffectedIds(this._conditions);
    await upsertLogMany(affectedIds);
    next();
  });

  const MongooseModel = _mongoose.default.model(collectionName, schema);

  const saveOne = async data => {
    const documentExists = await MongooseModel.findById(data._id, '_id');

    if (documentExists) {
      return MongooseModel.findOneAndUpdate({ _id: data._id }, data, { new: true, lean: true });
    }
    return MongooseModel.create(data).then(saved => saved.toObject());
  };

  const odmModel = {
    db: MongooseModel,
    save: data => {
      if (Array.isArray(data)) {
        const promises = data.map(entry => saveOne(entry));
        return Promise.all(promises);
      }

      return saveOne(data);
    },

    get: (query, select = '', pagination = {}) => MongooseModel.find(query, select, Object.assign({ lean: true }, pagination)),

    count: condition => MongooseModel.count(condition),

    getById: id => MongooseModel.findById(id, {}, { lean: true }),

    delete: async condition => {
      let cond = condition;
      if (_mongoose.default.Types.ObjectId.isValid(condition)) {
        cond = { _id: condition };
      }

      const affectedIds = await getAffectedIds(cond);
      const result = await MongooseModel.deleteMany(cond);

      if (affectedIds.length) {
        await upsertLogMany(affectedIds, true);
      }

      return result;
    } };


  _models.default[collectionName] = odmModel;
  return odmModel;
};exports.default = _default;