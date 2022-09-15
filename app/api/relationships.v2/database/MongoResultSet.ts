import { AggregationCursor, Cursor } from 'mongodb';
import { validatorType } from '../validation/ajvInstances';
import { ResultSet } from '../services/ResultSet';

interface MapperFunc<T, U> {
  (elem: T): U;
}

export type CountDocument = { total: number };
export class MongoResultSet<T, U = T> implements ResultSet<U> {
  private mongoCursor: Cursor<T>;

  private mapper: MapperFunc<T, U>;

  private countCursor?: Cursor<CountDocument>;

  private validate: validatorType;

  constructor(mongoCursor: Cursor<T>, validator: validatorType, mapper: MapperFunc<T, U>);

  constructor(
    mongoCursor: AggregationCursor<T>,
    validator: validatorType,
    countCursor: AggregationCursor<CountDocument>,
    mapper: MapperFunc<T, U>
  );

  constructor(
    mongoCursor: Cursor<T>,
    validator: validatorType,
    countOrMapper: Cursor<CountDocument> | MapperFunc<T, U>,
    mapper?: MapperFunc<T, U>
  ) {
    this.mongoCursor = mongoCursor;
    this.countCursor = typeof countOrMapper === 'function' ? undefined : countOrMapper;
    this.mapper = typeof countOrMapper === 'function' ? countOrMapper : mapper!;
    this.validate = validator;
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
      await this.validate(item);
      const mappedItem = this.mapper(item!);
      return mappedItem;
    }
    return null;
  }

  async all() {
    const result = await this.mongoCursor.toArray();
    for (let i = 0; i < result.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.validate(result[i]);
    }
    const mapped = result.map(this.mapper);
    return mapped;
  }

  async every(predicate: (item: U) => boolean): Promise<boolean> {
    let result = true;
    let counter = 0;

    // eslint-disable-next-line no-await-in-loop
    while (await this.hasNext()) {
      counter += 1;
      // eslint-disable-next-line no-await-in-loop
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

  static NoOpValidator = { validate: <V>(_item: V) => {} };
}
