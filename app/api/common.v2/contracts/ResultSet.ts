export interface ResultSet<T> {
  page(number: number, size: number): Promise<T[]>;
  all(): Promise<T[]>;
  forEach(callback: (item: T) => void): Promise<void>;
  map<U>(callback: (item: T) => U): ResultSet<U>;
  every(predicate: (item: T) => boolean): Promise<boolean>;
  first(): Promise<T | null>;
}
