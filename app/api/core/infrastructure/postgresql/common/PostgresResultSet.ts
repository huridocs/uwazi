/* eslint-disable no-await-in-loop */
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { BreakLoopSignal, ResultSet } from '../../../application/contracts/ResultSet.js';

type MapperFunc<T, U> = (elem: T) => U | Promise<U>;

/**
 * Postgres implementation of the ResultSet contract, backed by the
 * pg-query-stream exposed as an async generator (PostgresTable.stream()).
 *
 * Single-pass and self-cleaning: every method fully consumes the stream and
 * releases it (commit when fully drained, rollback otherwise). The wrapped
 * generator owns the transaction lifecycle: PostgresTable.stream() commits
 * when fully drained and rolls back when the generator is returned early —
 * which is what the terminal methods trigger when they stop mid-stream.
 *
 * See the ResultSet contract for why incremental streaming methods
 * (hasNext()/nextBatch()) are not exposed.
 */
export class PostgresResultSet<TRow, TDomain = TRow> implements ResultSet<TDomain> {
  private readonly iterator: AsyncIterator<TRow>;

  private readonly mapper: MapperFunc<TRow, TDomain>;

  private buffered: IteratorResult<TRow> | null = null;

  private closed = false;

  constructor(iterator: AsyncIterator<TRow>, mapper: MapperFunc<TRow, TDomain>) {
    this.iterator = iterator;
    this.mapper = mapper;
  }

  private async hasNext(): Promise<boolean> {
    const result = await this.peek();
    return !result.done;
  }

  private async nextBatch(size: number): Promise<TDomain[]> {
    const items: TDomain[] = [];
    while (items.length < size && (await this.hasNext())) {
      const item = await this.nextItem();
      if (item !== null) items.push(item);
    }
    return items;
  }

  async all(): Promise<TDomain[]> {
    try {
      const items: TDomain[] = [];
      while (await this.hasNext()) {
        const item = await this.nextItem();
        if (item !== null) items.push(item);
      }
      return items;
    } finally {
      await this.close();
    }
  }

  async first(): Promise<TDomain | null> {
    try {
      return await this.nextItem();
    } finally {
      await this.close();
    }
  }

  async forEach(callback: (item: TDomain) => BreakLoopSignal): Promise<void> {
    try {
      let shouldContinue = true;
      while (shouldContinue && (await this.hasNext())) {
        const item = await this.nextItem();
        shouldContinue = (await callback(item!)) !== false;
      }
    } finally {
      await this.close();
    }
  }

  async forEachBatch(
    batchSize: number,
    callback: (items: TDomain[]) => BreakLoopSignal
  ): Promise<void> {
    try {
      let progress = true;
      while (progress && (await this.hasNext())) {
        const items = await this.nextBatch(batchSize);
        progress = (await callback(items)) !== false;
      }
    } finally {
      await this.close();
    }
  }

  async find(predicate: (item: TDomain) => Promise<boolean> | boolean): Promise<TDomain | null> {
    let result: TDomain | null = null;
    await this.forEach(async item => {
      if ((await predicate(item!)) === true) {
        result = item;
        return false;
      }
    });
    return result;
  }

  async every(predicate: (item: TDomain) => Promise<boolean> | boolean): Promise<boolean> {
    let hasItems = false;
    const result = await this.find(async item => {
      hasItems = true;
      return (await predicate(item!)) === false;
    });
    return hasItems ? result === null : true;
  }

  async some(predicate: (item: TDomain) => Promise<boolean> | boolean): Promise<boolean> {
    const result = await this.find(predicate);
    return result !== null;
  }

  async indexed(getKey: (item: TDomain) => string | number) {
    const results = await this.all();
    return objectIndex(results, getKey, i => i);
  }

  /** Releases the underlying stream; rolls back when not fully drained. Idempotent. */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.iterator.return?.();
  }

  private async peek(): Promise<IteratorResult<TRow>> {
    if (!this.buffered) {
      this.buffered = await this.iterator.next();
    }
    return this.buffered;
  }

  private async next(): Promise<IteratorResult<TRow>> {
    if (this.buffered) {
      const result = this.buffered;
      this.buffered = null;
      return result;
    }
    return this.iterator.next();
  }

  private async nextItem(): Promise<TDomain | null> {
    const result = await this.next();
    if (result.done) return null;
    return this.mapper(result.value);
  }
}
