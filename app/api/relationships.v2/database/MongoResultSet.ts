/* eslint-disable no-await-in-loop */
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
    const data = await this.all();

    return { total, data };
  }

  async all() {
    const result = await this.mongoCursor.toArray();
    return result.map(this.mapper);
  }

  async every(predicate: (item: U) => boolean): Promise<boolean> {
    let result = true;

    while (await this.mongoCursor.hasNext()) {
      const item = await this.mongoCursor.next();
      const mappedItem = this.mapper(item!);
      if (predicate(mappedItem) === false) {
        result = false;
        break;
      }
    }

    await this.close();
    return result;
  }

  async close() {
    return Promise.all([this.countCursor?.close(), this.mongoCursor.close()]);
  }

  static NoOpMapper = <V>(item: V) => item;
}
