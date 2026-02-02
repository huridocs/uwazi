/* eslint-disable max-classes-per-file */
import cloneDeep from 'lodash/cloneDeep.js';

class ArraysError extends Error {}

class Arrays<T> {
  arr: { [key: string]: T[] };

  constructor(values?: { [key: string]: T[] }) {
    this.arr = values ? cloneDeep(values) : {};
  }

  push(key: string, value: T): void {
    if (!this.arr[key]) this.arr[key] = [];
    this.arr[key].push(value);
  }

  get(key: string): T[];

  get(key: string, index: number): T | undefined;

  get(key: string, index?: number): T | T[] | undefined {
    if (!index) return this.arr[key];
    return this.arr[key] ? this.arr[key][index] : undefined;
  }

  set(key: string): void;
  set(key: string, index: number, value: T): void;

  set(key: string, index?: number, value?: T): void {
    if (index && !value) {
      throw new ArraysError(
        'Needs one parameter for the key, or three parameters for the key, index, and value.'
      );
    }
    if (!this.arr[key]) this.arr[key] = [];
    if (index && value) this.arr[key][index] = value;
  }

  size(): number;

  size(key: string): number | undefined;

  size(key?: string): number | undefined {
    if (key) {
      return this.arr[key] ? this.arr[key].length : undefined;
    }
    return Object.values(this.arr).reduce((acc, val) => acc + val.length, 0);
  }

  arrayCount(): number {
    return Object.keys(this.arr).length;
  }
}

export { Arrays };
