/* eslint-disable max-classes-per-file */
type IndexTypes = string | number | symbol;

type Values<T extends IndexTypes = IndexTypes, U = any> = Record<T, Record<T, U>>;

class DoubleIndexedObjectError extends Error {}

class DoubleIndexedObject<T extends IndexTypes = IndexTypes, U = any> {
  obj = {} as Values<T, U>;

  constructor(values?: Values<T, U>) {
    this.obj = values || ({} as Values<T, U>);
  }

  set(index1: T): void;

  set(index1: T, index2: T, value: U): void;

  set(index1: T, index2?: T, value?: U): void {
    if (index2 && !value) {
      throw new DoubleIndexedObjectError(
        'Needs one index to initialize an empty nested object, or three indices for a full key1-key2-value information.'
      );
    }
    if (!this.obj[index1]) {
      this.obj[index1] = {} as Record<T, U>;
    }
    if (index2 && value) {
      this.obj[index1][index2] = value;
    }
  }

  get(index1: T, index2?: T): U | Record<T, U> {
    if (index2) {
      return this.obj[index1][index2];
    }
    return this.obj[index1];
  }
}

export type { IndexTypes, Values };

export { DoubleIndexedObject, DoubleIndexedObjectError };
