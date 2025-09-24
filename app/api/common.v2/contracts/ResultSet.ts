// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { IndexTypes } from 'shared/data_utils/objectIndex.js';

export type BreakLoopSignal = Promise<void | boolean> | void | boolean;

export interface ResultSet<T> {
  all(): Promise<T[]>;
  page(number: number, size: number): Promise<T[]>;
  first(): Promise<T | null>;
  hasNext(): Promise<boolean>;
  nextBatch(size: number): Promise<T[]>;
  forEach(callback: (item: T) => BreakLoopSignal): Promise<void>;
  forEachBatch(batchSize: number, callback: (items: T[]) => BreakLoopSignal): Promise<void>;
  find(predicate: (item: T) => Promise<boolean> | boolean): Promise<T | null>;
  every(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
  some(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
  indexed(predicate: (item: T) => string | number): Promise<Record<IndexTypes, Awaited<T>>>;
}
