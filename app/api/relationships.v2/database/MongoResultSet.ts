import { Cursor as MongoCursor } from 'mongodb';
import { ResultSet } from '../services/ResultSet';

type MapperFunc<T, U> = (elem: T) => U;
export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: MongoCursor<T>;

  private mapper: MapperFunc<T, U>;

  constructor(mongoCursor: MongoCursor<T>, mapper: MapperFunc<T, U>) {
    this.mongoCursor = mongoCursor;
    this.mapper = mapper;
  }

  async page(number: number, size: number) {
    this.mongoCursor.skip((number - 1) * size).limit(size);

    const total = await this.mongoCursor.count();
    const data = (await this.mongoCursor.toArray()).map(item => this.mapper(item));

    return { total, data };
  }

  static NoOpMapper = <V>(item: V) => item;
}
