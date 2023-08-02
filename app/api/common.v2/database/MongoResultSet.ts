/* eslint-disable no-await-in-loop */
import { AggregationCursor, FindCursor } from 'mongodb';
import { BreakLoopSignal, ResultSet } from '../contracts/ResultSet';
import { objectIndex } from 'shared/data_utils/objectIndex';

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

  async nextBatch(size: number): Promise<U[]> {
    const dbos: T[] = [];
    while ((await this.mongoCursor.hasNext()) && dbos.length < size) {
      const item = await this.mongoCursor.next();
      if (item) {
        dbos.push(item);
      }
    }
    const mapped = await Promise.all(dbos.map(async item => this.mapper(item)));
    return mapped;
  }

  async all() {
    const results = await this.mongoCursor.toArray();
    const mapped = await Promise.all(results.map(async item => this.mapper(item)));
    return mapped;
  }

  async indexed<K extends string | number>(getKey: (item: U) => K) {
    const results = await this.all();
    return objectIndex(results, getKey, i => i);
  }

  async forEach(callback: (item: U) => BreakLoopSignal) {
    let shouldContinue = true;
    while (shouldContinue && (await this.hasNext())) {
      const item: U | null = await this.next();
      shouldContinue = (await callback(item!)) !== false;
    }
    await this.close();
  }

  async forEachBatch(batchSize: number, callback: (items: U[]) => BreakLoopSignal) {
    let progress = true;
    while (progress && (await this.hasNext())) {
      const items: U[] = await this.nextBatch(batchSize);
      progress = (await callback(items)) !== false;
    }
    await this.close();
  }

  async find(predicate: (item: U) => boolean): Promise<U | null> {
    let result: U | null = null;

    await this.forEach(item => {
      if (predicate(item!) === true) {
        result = item;
        return false;
      }
    });

    return result;
  }

  async every(predicate: (item: U) => boolean): Promise<boolean> {
    let hasItems = false;

    const result = await this.find(item => {
      hasItems = true;
      return predicate(item!) === false;
    });

    return hasItems && result === null;
  }

  async some(predicate: (item: U) => boolean): Promise<boolean> {
    const result = await this.find(predicate);

    return result !== null;
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
