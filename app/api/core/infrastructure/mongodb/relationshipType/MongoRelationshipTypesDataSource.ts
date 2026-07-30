import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import { RelationshipTypeDBO } from './schemas/RelationshipTypeDBO.js';
import { mapRelationshipTypeToApp } from './mappings/RelationshipTypeMappers.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

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

  async create(relationshipType: RelationshipType): Promise<void> {
    await this.getCollection().insertOne({
      _id: MongoIdHandler.mapToDb(relationshipType.id),
      name: relationshipType.name,
    });
  }

  async update(relationshipType: RelationshipType): Promise<void> {
    await this.getCollection().updateOne(
      { _id: MongoIdHandler.mapToDb(relationshipType.id) },
      { $set: { name: relationshipType.name } }
    );
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

  async getByIds(ids: string[]): Promise<RelationshipType[]> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }
    const dbos = await this.getCollection()
      .find({
        _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) },
      })
      .toArray();
    return dbos.map(mapRelationshipTypeToApp);
  }
}
