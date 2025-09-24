// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';

import { MongoResultSet } from 'api/common.v2/database/MongoResultSet.js';
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
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const countInExistence = await this.getCollection().countDocuments({
      _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) },
    });
    return countInExistence === uniqueIds.length;
  }

  async getRelationshipTypeIds(): Promise<string[]> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    return (await this.getCollection().find({}).toArray()).map(rt =>
      MongoIdHandler.mapToApp(rt._id)
    );
  }

  getByIds(ids: string[]): MongoResultSet<RelationshipTypeDBO, RelationshipType> {
    const uniqueIds = Array.from(new Set(ids));
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const cursor = this.getCollection().find({
      _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) },
    });
    return new MongoResultSet<RelationshipTypeDBO, RelationshipType>(
      cursor,
      mapRelationshipTypeToApp
    );
  }
}
