type IndexTypes = string | number;

export type BreakLoopSignal = Promise<void | boolean> | void | boolean;

/**
 * Self-cleaning, single-pass view over a query result.
 *
 * Every method fully consumes the underlying cursor/stream and releases it
 * before resolving — callers never manage the lifecycle.
 *
 * Incremental streaming methods (e.g. hasNext()/nextBatch()) are deliberately
 * NOT part of this interface: the underlying mongo cursor / pg stream holds a
 * database connection (and, on Postgres, an open transaction) for as long as
 * the result set lives, so a caller that reads a few batches and then
 * abandons the result set would silently hold that connection until garbage
 * collection. Making every method terminal forces the cleanup path to always
 * run. If you need to process results in a streaming fashion, use
 * forEach()/forEachBatch() — they stream with guaranteed cleanup.
 */
export interface ResultSet<T> {
  all(): Promise<T[]>;
  first(): Promise<T | null>;
  forEach(callback: (item: T) => BreakLoopSignal): Promise<void>;
  forEachBatch(batchSize: number, callback: (items: T[]) => BreakLoopSignal): Promise<void>;
  find(predicate: (item: T) => Promise<boolean> | boolean): Promise<T | null>;
  every(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
  some(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
  indexed(predicate: (item: T) => string | number): Promise<Record<IndexTypes, T>>;
}
