import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Extractor, IXExtractorsDataSource } from '../domain/IXExtractorsDataSource.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const toObjectId = (value: ObjectIdSchema) =>
  value instanceof ObjectId ? value : new ObjectId(value.toString());

const toObjectIds = (values: ObjectIdSchema[]) => values.map(toObjectId);

export const ixExtractorsCollection = 'ixextractors';

/**
 * Mongo implementation of {@link IXExtractorsDataSource}.
 *
 * Extends `MongoDataSource` rather than wrapping the mongoose model: its `SyncedCollection`
 * writes the same `{namespace, mongoId, timestamp, deleted}` rows to `updatelogs` that the
 * odm's `UpdateLogHelper` did, so instance-to-instance sync is preserved across the swap.
 * `MongoFilesDAO` is the precedent for the same migration on `files`.
 */
export class MongoIXExtractorsDataSource
  extends MongoDataSource<Extractor>
  implements IXExtractorsDataSource
{
  protected collectionName = ixExtractorsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getById(id: ObjectIdSchema) {
    const extractor = await this.getCollection().findOne({ _id: toObjectId(id) as any });
    return extractor ?? undefined;
  }

  async getByIds(ids: ObjectIdSchema[]) {
    return this.getCollection()
      .find({ _id: { $in: toObjectIds(ids) } as any })
      .toArray();
  }

  async getAll() {
    return this.getCollection().find({}).toArray();
  }

  async getByTemplate(templateId: ObjectIdSchema) {
    return this.getCollection()
      .find({ templates: { $in: [toObjectId(templateId)] } as any })
      .toArray();
  }

  async getPropertySourceExtractorsForTemplate(templateId: ObjectIdSchema) {
    return this.getCollection()
      .find({
        templates: { $in: [toObjectId(templateId)] } as any,
        'source.property': { $exists: true },
      })
      .toArray();
  }

  async getPdfSourceExtractorsForTemplate(templateId: ObjectIdSchema) {
    return this.getCollection()
      .find({
        templates: { $in: [toObjectId(templateId)] } as any,
        'source.pdf': { $exists: true },
      })
      .toArray();
  }

  async getByTemplateExcludingProperties(
    templateId: ObjectIdSchema,
    propertyNamesToKeep: string[]
  ) {
    return this.getCollection()
      .find({
        templates: toObjectId(templateId) as any,
        property: { $nin: propertyNamesToKeep },
      })
      .toArray();
  }

  async create(extractor: Omit<IXExtractorType, '_id'>) {
    const toInsert = {
      ...extractor,
      templates: toObjectIds(extractor.templates),
    };
    const { insertedId } = await this.getCollection().insertOne(toInsert as any);
    return { ...toInsert, _id: insertedId } as unknown as Extractor;
  }

  async update(extractor: IXExtractorType) {
    const { _id, ...rest } = extractor;
    const toSet = { ...rest, templates: toObjectIds(extractor.templates) };
    await this.getCollection().updateOne({ _id: toObjectId(_id) as any }, { $set: toSet as any });
    return { ...toSet, _id: toObjectId(_id) } as unknown as Extractor;
  }

  async deleteByIds(ids: ObjectIdSchema[]) {
    await this.getCollection().deleteMany({ _id: { $in: toObjectIds(ids) } as any });
  }

  async removeTemplateFromExtractors(ids: ObjectIdSchema[], templateId: ObjectIdSchema) {
    await this.getCollection().updateMany({ _id: { $in: toObjectIds(ids) } as any }, {
      $pull: { templates: toObjectId(templateId) },
    } as any);
  }

  async deleteEmptyByIds(ids: ObjectIdSchema[]) {
    await this.getCollection().deleteMany({
      _id: { $in: toObjectIds(ids) } as any,
      templates: { $size: 0 },
    });
  }
}
