import { Cursor } from 'mongodb';
import { ResultSet } from '../services/ResultSet';

type MapperFunc<T, U> = (elem: T) => U;

export type CountDocument = { total: number };
export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: Cursor<T>;

  private mapper: MapperFunc<T, U>;

  private countCursor?: Cursor<CountDocument>;

  constructor(mongoCursor: Cursor<T>, mapper: MapperFunc<T, U>);

  constructor(mongoCursor: Cursor<T>, countCursor: Cursor<CountDocument>, mapper: MapperFunc<T, U>);

  constructor(
    mongoCursor: Cursor<T>,
    countOrMapper: Cursor<CountDocument> | MapperFunc<T, U>,
    mapper?: MapperFunc<T, U>
  ) {
    this.mongoCursor = mongoCursor;
    this.countCursor = typeof countOrMapper === 'function' ? undefined : countOrMapper;
    this.mapper = typeof countOrMapper === 'function' ? countOrMapper : mapper!;
  }

  private async getTotal() {
    if (this.countCursor) {
      const [count] = await this.countCursor.toArray();
      return count.total;
    }

    return this.mongoCursor.count();
  }

  async page(number: number, size: number) {
    this.mongoCursor.skip((number - 1) * size).limit(size);

    const total = await this.getTotal();
    const data = (await this.mongoCursor.toArray()).map(item => this.mapper(item));

    return { total, data };
  }

  async all() {
    return this.mongoCursor.toArray();
  }

  static NoOpMapper = <V>(item: V) => item;
}
