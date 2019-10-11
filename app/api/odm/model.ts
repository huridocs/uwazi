import mongoose from "mongoose";

import { model as updatelogsModel } from "api/updatelogs";

import models from "./models";
import { OdmModel } from "./models";

const generateID = mongoose.Types.ObjectId;
export { generateID };

export default <T extends mongoose.Document>(
  collectionName: string,
  schema: mongoose.Schema
) => {
  const getAffectedIds = async (conditions: any) =>
    mongoose.models[collectionName].distinct("_id", conditions);

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

  schema.post("save", upsertLogOne);
  schema.post("findOneAndUpdate", upsertLogOne);

  const MongooseModel = mongoose.model<T>(collectionName, schema);

  const saveOne = async (data: mongoose.Document): Promise<T | null> => {
    const documentExists = await MongooseModel.findById(data._id, "_id");

    if (documentExists) {
      return MongooseModel.findOneAndUpdate({ _id: data._id }, data, {
        new: true
      }).exec();
    }
    return MongooseModel.create(data).then(saved => saved.toObject());
  };

  const odmModel: OdmModel<mongoose.Document> = {
    db: MongooseModel,
    save: (data: mongoose.Document | mongoose.Document[]) => {
      if (Array.isArray(data)) {
        const promises = data.map(entry => saveOne(entry));
        return Promise.all(promises);
      }

      return saveOne(data);
    },

    get: (query: any, select = "", pagination = {}) =>
      MongooseModel.find(
        query,
        select,
        Object.assign({ lean: true }, pagination)
      ).exec(),

    count: (condition: any) => MongooseModel.count(condition).exec(),

    getById: (id: any | string | number) =>
      MongooseModel.findById(id, {}, { lean: true }).exec(),

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
    }
  };

  models[collectionName] = odmModel;
  return odmModel;
};
