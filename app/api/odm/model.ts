import mongoose from 'mongoose';

import { model as updatelogsModel } from 'api/updatelogs';

import models from './models';
import { OdmModel } from './models';

const generateID = mongoose.Types.ObjectId;
export { generateID };

export default <T extends mongoose.Document>(collectionName: string, schema: mongoose.Schema) => {
  const getAffectedIds = async (conditions: any) =>
    mongoose.models[collectionName].distinct('_id', conditions);

  const upsertLogOne = async (
    doc: mongoose.Document,
    next: (err?: mongoose.NativeError) => void
  ) => {
    const logData = { namespace: collectionName, mongoId: doc._id };
    await updatelogsModel.findOneAndUpdate(
      logData,
      { ...logData, timestamp: Date.now(), deleted: false },
      { upsert: true }
    );
    next();
  };

  async function upsertLogMany(affectedIds: any[], deleted = false) {
    await updatelogsModel.updateMany(
      { mongoId: { $in: affectedIds }, namespace: collectionName },
      { $set: { timestamp: Date.now(), deleted } },
      { upsert: true, lean: true }
    );
  }

  schema.post('save', upsertLogOne);
  schema.post('findOneAndUpdate', upsertLogOne);
  schema.post('updateMany', async function updateMany(this: any, doc, next) {
    const affectedIds = await getAffectedIds(this._conditions);
    await upsertLogMany(affectedIds);
    next();
  });

  const MongooseModel = mongoose.model<T>(collectionName, schema);

  const saveOne = async (data: mongoose.Document): Promise<T> => {
    const documentExists = await MongooseModel.findById(data._id, '_id');

    if (documentExists) {
      let saved = await MongooseModel.findOneAndUpdate({ _id: data._id }, data, { new: true });
      if (saved === null) {
        throw Error('mongoose findOneAndUpdate should never return null!');
      }
      return saved;
    }
    return MongooseModel.create(data).then(saved => saved.toObject());
  };

  const odmModel: OdmModel<T> = {
    db: MongooseModel,
    save: (data: T) => {
      return saveOne(data);
    },

    get: (query: any, select = '', pagination = {}) =>
      MongooseModel.find(query, select, Object.assign({ lean: true }, pagination)).exec(),

    count: (condition: any) => MongooseModel.count(condition).exec(),

    getById: (id: any | string | number) => MongooseModel.findById(id, {}, { lean: true }).exec(),

    delete: async condition => {
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
    },
  };
  // Unfortunately, we cannot just case OdmModel<T> to OdmModel<Document>...
  const genericOdmModel: OdmModel<mongoose.Document> = {
    db: MongooseModel,
    save: (data: mongoose.Document) => {
      return saveOne(data);
    },
    get: odmModel.get,
    count: odmModel.count,
    getById: odmModel.getById,
    delete: odmModel.delete,
  };

  models[collectionName] = genericOdmModel;
  return odmModel;
};
