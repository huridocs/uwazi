interface Page<T> {
  total: number;
  data: Array<T>;
}

export interface ResultSet<T> {
  page(number: number, size: number): Promise<Page<T>>;
  all(): Promise<T[]>;
  every(predicate: (item: T) => boolean): Promise<boolean>;
}
