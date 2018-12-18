import mongoose from 'mongoose';
import { model as updateLogModel } from 'api/updatelog';
import models from './models';

const generateID = mongoose.Types.ObjectId;
export { generateID };

export default (collectionName, schema) => {
  const getAffectedIds = async conditions => mongoose.models[collectionName].find(conditions, { _id: true });

  const upsertLogOne = async (doc, next) => {
    const logData = { namespace: collectionName, mongoId: doc._id };
    await updateLogModel.findOneAndUpdate(logData, { ...logData, timestamp: Date.now() }, { upsert: true, lean: true });
    next();
  };

  async function upsertLogMany(affectedIds, deleted = false) {
    await updateLogModel.updateMany(
      { mongoId: { $in: affectedIds.map(i => i._id) }, namespace: collectionName },
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

  const odmModel = {
    db: MongooseModel,
    save: (data) => {
      if (Array.isArray(data)) {
        const promises = data.map((entry) => {
          if (entry._id) {
            return MongooseModel.findOneAndUpdate({ _id: entry._id }, entry, { new: true, lean: true });
          }
          return MongooseModel.create(entry).then(saved => saved.toObject());
        });
        return Promise.all(promises);
      }

      if (data._id) {
        return MongooseModel.findOneAndUpdate({ _id: data._id }, data, { new: true, lean: true });
      }
      return MongooseModel.create(data).then(saved => saved.toObject());
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
      await upsertLogMany(affectedIds, true);

      return result;
    }
  };

  models[collectionName] = odmModel;
  return odmModel;
};
