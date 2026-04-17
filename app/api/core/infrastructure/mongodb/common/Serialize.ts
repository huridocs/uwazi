import { ObjectId } from 'mongodb';

type Serialize<T> = T extends ObjectId
  ? string
  : T extends Array<infer U>
    ? Serialize<U>[]
    : T extends object
      ? { [K in keyof T]: Serialize<T[K]> }
      : T;

export type { Serialize };
