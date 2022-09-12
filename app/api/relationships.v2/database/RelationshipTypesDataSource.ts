import { ObjectId } from 'mongodb';
import { MongoDataSource } from './MongoDataSource';

export class RelationshipTypesDataSource extends MongoDataSource {
  async typesExist(ids: string[]) {
    const countInExistence = await this.db
      .collection('relationtypes')
      .countDocuments({ _id: { $in: ids.map(id => new ObjectId(id)) } }, { session: this.session });
    return countInExistence === ids.length;
  }
}
