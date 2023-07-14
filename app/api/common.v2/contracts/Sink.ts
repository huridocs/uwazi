interface Sink<T> {
  flush(): Promise<void>;
  push(item: T): Promise<void>;
}

export type { Sink };
