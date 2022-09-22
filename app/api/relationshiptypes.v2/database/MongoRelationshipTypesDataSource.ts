import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource';

export class MongoRelationshipTypesDataSource
  extends MongoDataSource
  implements RelationshipTypesDataSource { // eslint-disable-line
  async typesExist(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    const countInExistence = await this.db
      .collection('relationtypes')
      .countDocuments(
        { _id: { $in: uniqueIds.map(id => new ObjectId(id)) } },
        { session: this.session }
      );
    return countInExistence === uniqueIds.length;
  }
}
