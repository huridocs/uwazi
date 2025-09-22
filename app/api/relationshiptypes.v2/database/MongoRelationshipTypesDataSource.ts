import { MongoDataSource } from '../common.v2/database/MongoDataSource.js';
import { MongoIdHandler } from '../common.v2/database/MongoIdGenerator.js';
import { MongoResultSet } from '../common.v2/database/MongoResultSet.js';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource';
import { RelationshipTypeDBO } from './schemas/RelationshipTypeDBO';
import { mapRelationshipTypeToApp } from './mappings/RelationshipTypeMappers';
import { RelationshipType } from '../model/RelationshipType';

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
