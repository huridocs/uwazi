export type BreakLoopSignal = Promise<void | boolean> | void | boolean;

export interface ResultSet<T> {
  all(): Promise<T[]>;
  page(number: number, size: number): Promise<T[]>;
  first(): Promise<T | null>;
  forEach(callback: (item: T) => BreakLoopSignal): Promise<void>;
  forEachBatch(batchSize: number, callback: (items: T[]) => BreakLoopSignal): Promise<void>;
  find(predicate: (item: T) => Promise<boolean> | boolean): Promise<T | null>;
  every(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
  some(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean>;
}
