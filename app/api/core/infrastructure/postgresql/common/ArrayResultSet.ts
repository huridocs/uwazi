/* eslint-disable no-await-in-loop */
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { BreakLoopSignal, ResultSet } from '#api/core/application/contracts/ResultSet.js';

/**
 * In-memory ResultSet over a lazily loaded array (e.g. Postgres query results).
 *
 * Needed because RelationshipTypesDataSource.getByIds() still returns ResultSet
 * (Mongo uses MongoResultSet). Templates/Files PG adapters return Promise<T[]> instead.
 */
export class ArrayResultSet<T> implements ResultSet<T> {
  private itemsPromise?: Promise<T[]>;

  private items?: T[];

  private index = 0;

  constructor(private readonly load: () => Promise<T[]>) {}

  private async ensureLoaded(): Promise<T[]> {
    if (this.items) {
      return this.items;
    }
    if (!this.itemsPromise) {
      this.itemsPromise = this.load();
    }
    this.items = await this.itemsPromise;
    return this.items;
  }

  async all(): Promise<T[]> {
    return this.ensureLoaded();
  }

  async page(number: number, size: number): Promise<T[]> {
    const items = await this.ensureLoaded();
    const start = (number - 1) * size;
    return items.slice(start, start + size);
  }

  async first(): Promise<T | null> {
    const items = await this.ensureLoaded();
    return items[0] ?? null;
  }

  async hasNext(): Promise<boolean> {
    const items = await this.ensureLoaded();
    return this.index < items.length;
  }

  async nextBatch(size: number): Promise<T[]> {
    const items = await this.ensureLoaded();
    const batch = items.slice(this.index, this.index + size);
    this.index += batch.length;
    return batch;
  }

  async forEach(callback: (item: T) => BreakLoopSignal): Promise<void> {
    const items = await this.ensureLoaded();
    for (const item of items) {
      if ((await callback(item)) === false) {
        break;
      }
    }
  }

  async forEachBatch(batchSize: number, callback: (items: T[]) => BreakLoopSignal): Promise<void> {
    while (await this.hasNext()) {
      const batch = await this.nextBatch(batchSize);
      if ((await callback(batch)) === false) {
        break;
      }
    }
  }

  async find(predicate: (item: T) => Promise<boolean> | boolean): Promise<T | null> {
    let found: T | null = null;
    await this.forEach(async item => {
      if (await predicate(item)) {
        found = item;
        return false;
      }
      return undefined;
    });
    return found;
  }

  async every(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean> {
    const items = await this.ensureLoaded();
    if (items.length === 0) {
      return true;
    }
    for (const item of items) {
      if (!(await predicate(item))) {
        return false;
      }
    }
    return true;
  }

  async some(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean> {
    return (await this.find(predicate)) !== null;
  }

  async indexed(
    predicate: (item: T) => string | number
  ): Promise<Record<string | number, Awaited<T>>> {
    const items = await this.ensureLoaded();
    return objectIndex(items, predicate, i => i as Awaited<T>);
  }
}
