import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource';

export class MongoRelationshipTypesDataSource
  extends MongoDataSource
  implements RelationshipTypesDataSource { // eslint-disable-line
  protected collectionName = 'relationtypes';

  async typesExist(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const countInExistence = await this.getCollection().countDocuments(
      { _id: { $in: uniqueIds.map(MongoIdHandler.mapToDb) } },
      { session: this.getSession() }
    );
    return countInExistence === uniqueIds.length;
  }
}
