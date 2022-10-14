/* eslint-disable no-await-in-loop */
import { AggregationCursor, Cursor } from 'mongodb';
import { ResultSet } from '../contracts/ResultSet';

interface MapperFunc<T, U> {
  (elem: T): U | Promise<U>;
}

export type CountDocument = { total: number };
export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: Cursor<T>;

  private mapper: MapperFunc<T, U>;

  private countCursor?: Cursor<CountDocument>;

  constructor(mongoCursor: Cursor<T>, mapper: MapperFunc<T, U>);

  constructor(
    mongoCursor: AggregationCursor<T>,
    countCursor: AggregationCursor<CountDocument>,
    mapper: MapperFunc<T, U>
  );

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

  async hasNext() {
    return this.mongoCursor.hasNext();
  }

  async next() {
    const item = await this.mongoCursor.next();
    if (item) {
      const mappedItem = this.mapper(item!);
      return mappedItem;
    }
    return null;
  }

  async all() {
    const results = await this.mongoCursor.toArray();
    const mapped = await Promise.all(results.map(item => this.mapper(item)));
    return mapped;
  }

  async forEach(callback: (item: U) => void) {
    return this.mongoCursor.forEach(async item => {
      callback(await this.mapper(item));
    });
  }

  map<V>(transform: (item: U) => V) {
    return new MongoResultSet(
      this.mongoCursor.map(async elem => this.mapper(elem)),
      async item => transform(await item)
    );
  }

  async every(predicate: (item: U) => boolean): Promise<boolean> {
    let result = true;
    let counter = 0;

    while (await this.hasNext()) {
      counter += 1;
      const item = await this.next();
      if (predicate(item!) === false) {
        result = false;
        break;
      }
    }

    await this.close();
    return counter > 0 && result;
  }

  async first() {
    this.mongoCursor.limit(1);
    const [result] = await this.all();
    return result || null;
  }

  async close() {
    return Promise.all([this.countCursor?.close(), this.mongoCursor.close()]);
  }

  static NoOpMapper = <V>(item: V) => item;
}
