interface SaveStream<T> {
  flush(): Promise<void>;
  push(item: T): Promise<void>;
}

export type { SaveStream };
