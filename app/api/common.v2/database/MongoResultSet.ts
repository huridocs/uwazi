/* eslint-disable no-await-in-loop */
import { AggregationCursor, FindCursor } from 'mongodb';
import { ResultSet } from '../contracts/ResultSet';

interface MapperFunc<T, U> {
  (elem: T): U | Promise<U>;
}

type Cursor<T> = AggregationCursor<T> | FindCursor<T>;

export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: Cursor<T>;

  private mapper: MapperFunc<T, U>;

  constructor(mongoCursor: Cursor<T>, mapper: MapperFunc<T, U>) {
    this.mongoCursor = mongoCursor;
    this.mapper = mapper;
  }

  async page(number: number, size: number) {
    this.mongoCursor.skip((number - 1) * size).limit(size);
    return this.all();
  }

  async hasNext() {
    return this.mongoCursor.hasNext();
  }

  async next() {
    const item: T | null = await this.mongoCursor.next();
    if (item) {
      const mappedItem = this.mapper(item);
      return mappedItem;
    }
    return null;
  }

  async all() {
    const results = await this.mongoCursor.toArray();
    const mapped = await Promise.all(results.map(async item => this.mapper(item)));
    return mapped;
  }

  async forEach(callback: (item: U) => Promise<void> | void) {
    while (await this.hasNext()) {
      const item: U | null = await this.next();
      await callback(item!);
    }
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

  async some(predicate: (item: U) => boolean): Promise<boolean> {
    let result = false;

    while (await this.hasNext()) {
      const item = await this.next();
      if (predicate(item!) === true) {
        result = true;
        break;
      }
    }

    await this.close();
    return result;
  }

  async first() {
    this.mongoCursor.limit(1);
    const [result] = await this.all();
    return result || null;
  }

  async close() {
    return this.mongoCursor.close();
  }

  static NoOpMapper = <V>(item: V) => item;
}
