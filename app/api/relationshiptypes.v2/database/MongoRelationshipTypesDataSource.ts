import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource.js';
import { RelationshipTypeDBO } from './schemas/RelationshipTypeDBO.js';
import { mapRelationshipTypeToApp } from './mappings/RelationshipTypeMappers.js';
import { RelationshipType } from '../model/RelationshipType.js';

export class MongoRelationshipTypesDataSource
  extends MongoDataSource<RelationshipTypeDBO>
  implements RelationshipTypesDataSource
{
  protected collectionName = 'relationtypes';

  async getAll(): Promise<RelationshipType[]> {
    return (await this.getCollection().find({}).toArray()).map(mapRelationshipTypeToApp);
  }

  async getById(id: string): Promise<RelationshipType | null> {
    const dbo = await this.getCollection().findOne({ _id: MongoIdHandler.mapToDb(id) });
    return dbo ? mapRelationshipTypeToApp(dbo) : null;
  }

  async create(input: { name: string }): Promise<RelationshipType> {
    const response = await this.getCollection().insertOne({
      name: input.name,
    } as RelationshipTypeDBO);
    const created = await this.getCollection().findOne({ _id: response.insertedId });
    if (!created) {
      throw new Error('Relationship type creation failed');
    }
    return mapRelationshipTypeToApp(created);
  }

  async update(input: { id: string; name: string }): Promise<RelationshipType> {
    await this.getCollection().updateOne(
      { _id: MongoIdHandler.mapToDb(input.id) },
      { $set: { name: input.name } }
    );
    const updated = await this.getCollection().findOne({ _id: MongoIdHandler.mapToDb(input.id) });
    if (!updated) {
      throw new Error('Relationship type update failed');
    }
    return mapRelationshipTypeToApp(updated);
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: MongoIdHandler.mapToDb(id) });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const query: any = {
      $expr: {
        $eq: [{ $toLower: { $trim: { input: '$name' } } }, normalized],
      },
    };
    if (excludeId) {
      query._id = { $ne: MongoIdHandler.mapToDb(excludeId) };
    }
    const existing = await this.getCollection().findOne(query);
    return Boolean(existing);
  }

  async typesExist(ids: string[]): Promise<boolean> {
    const uniqueIds = Array.from(new Set(ids));
    const countInExistence = await this.getCollection().countDocuments({
      _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) },
    });
    return countInExistence === uniqueIds.length;
  }

  async getRelationshipTypeIds(): Promise<string[]> {
    return (await this.getCollection().find({}).toArray()).map(rt =>
      MongoIdHandler.mapToApp(rt._id)
    );
  }

  getByIds(ids: string[]): MongoResultSet<RelationshipTypeDBO, RelationshipType> {
    const uniqueIds = Array.from(new Set(ids));
    const cursor = this.getCollection().find({
      _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) },
    });
    return new MongoResultSet<RelationshipTypeDBO, RelationshipType>(
      cursor,
      mapRelationshipTypeToApp
    );
  }
}
