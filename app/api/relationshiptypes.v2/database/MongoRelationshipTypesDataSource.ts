import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource';

export class MongoRelationshipTypesDataSource
  extends MongoDataSource
  implements RelationshipTypesDataSource { // eslint-disable-line
  async typesExist(ids: string[]) {
    const countInExistence = await this.db
      .collection('relationtypes')
      .countDocuments({ _id: { $in: ids.map(id => new ObjectId(id)) } }, { session: this.session });
    return countInExistence === ids.length;
  }
}
