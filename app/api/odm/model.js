import mongoose from 'mongoose';

import { model as updatelogsModel } from 'api/updatelogs';

import models from './models';

const generateID = mongoose.Types.ObjectId;
export { generateID };

export default (collectionName, schema) => {
  const getAffectedIds = async conditions => mongoose.models[collectionName].distinct('_id', conditions);

  const upsertLogOne = async (doc, next) => {
    const logData = { namespace: collectionName, mongoId: doc._id };
    await updatelogsModel.findOneAndUpdate(logData, { ...logData, timestamp: Date.now(), deleted: false }, { upsert: true, lean: true });
    next();
  };

  async function upsertLogMany(affectedIds, deleted = false) {
    await updatelogsModel.updateMany(
      { mongoId: { $in: affectedIds }, namespace: collectionName },
      { $set: { timestamp: Date.now(), deleted } },
      { upsert: true, lean: true }
    );
  }

  schema.post('save', upsertLogOne);
  schema.post('findOneAndUpdate', upsertLogOne);

  schema.post('updateMany', async function updateMany(doc, next) {
    const affectedIds = await getAffectedIds(this._conditions);
    await upsertLogMany(affectedIds);
    next();
  });

  const MongooseModel = mongoose.model(collectionName, schema);

  const saveOne = async (data) => {
    const documentExists = await MongooseModel.findById(data._id, '_id');

    if (documentExists) {
      return MongooseModel.findOneAndUpdate({ _id: data._id }, data, { new: true, lean: true });
    }
    return MongooseModel.create(data).then(saved => saved.toObject());
  };

  const odmModel = {
    db: MongooseModel,
    save: (data) => {
      if (Array.isArray(data)) {
        const promises = data.map(entry => saveOne(entry));
        return Promise.all(promises);
      }

      return saveOne(data);
    },

    get: (query, select = '', pagination = {}) => MongooseModel.find(query, select, Object.assign({ lean: true }, pagination)),

    count: condition => MongooseModel.count(condition),

    getById: id => MongooseModel.findById(id, {}, { lean: true }),

    delete: async (condition) => {
      let cond = condition;
      if (mongoose.Types.ObjectId.isValid(condition)) {
        cond = { _id: condition };
      }

      const affectedIds = await getAffectedIds(cond);
      const result = await MongooseModel.deleteMany(cond);

      if (affectedIds.length) {
        await upsertLogMany(affectedIds, true);
      }

      return result;
    }
  };

  models[collectionName] = odmModel;
  return odmModel;
};
