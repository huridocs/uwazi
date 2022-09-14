/* eslint-disable no-await-in-loop */
import { AggregationCursor, Cursor } from 'mongodb';
import { ResultSet } from '../services/ResultSet';
import { DataBlueprint } from '../validation/dataBlueprint';

type MapperFunc<T, U> = (elem: T) => U;

export type CountDocument = { total: number };
export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: Cursor<T>;

  private mapper: MapperFunc<T, U>;

  private countCursor?: Cursor<CountDocument>;

  private dbBlueprint: DataBlueprint;

  constructor(mongoCursor: Cursor<T>, dbBlueprint: DataBlueprint, mapper: MapperFunc<T, U>);

  constructor(
    mongoCursor: AggregationCursor<T>,
    dbBlueprint: DataBlueprint,
    countCursor: AggregationCursor<CountDocument>,
    mapper: MapperFunc<T, U>
  );

  constructor(
    mongoCursor: Cursor<T>,
    dbBlueprint: DataBlueprint,
    countOrMapper: Cursor<CountDocument> | MapperFunc<T, U>,
    mapper?: MapperFunc<T, U>
  ) {
    this.mongoCursor = mongoCursor;
    this.countCursor = typeof countOrMapper === 'function' ? undefined : countOrMapper;
    this.mapper = typeof countOrMapper === 'function' ? countOrMapper : mapper!;
    this.dbBlueprint = dbBlueprint;
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
      this.dbBlueprint.validate(item);
      const mappedItem = this.mapper(item!);
      return mappedItem;
    }
    return null;
  }

  async all() {
    const result = await this.mongoCursor.toArray();
    result.forEach(r => {
      this.dbBlueprint.validate(r);
    });
    const mapped = result.map(this.mapper);
    return mapped;
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

  async close() {
    return Promise.all([this.countCursor?.close(), this.mongoCursor.close()]);
  }

  static NoOpMapper = <V>(item: V) => item;
}
