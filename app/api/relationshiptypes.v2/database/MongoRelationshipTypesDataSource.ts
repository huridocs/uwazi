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
