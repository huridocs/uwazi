import { Cursor as MongoCursor } from 'mongodb';
import { ResultSet } from '../services/ResultSet';

export class MongoResultSet<T> implements ResultSet<T> {
  private mongoCursor: MongoCursor<T>;

  constructor(mongoCursor: MongoCursor<T>) {
    this.mongoCursor = mongoCursor;
  }

  async page(number: number, size: number) {
    this.mongoCursor.skip((number - 1) * size).limit(size);

    const total = await this.mongoCursor.count();
    const data = await this.mongoCursor.toArray();

    return { total, data };
  }
}
