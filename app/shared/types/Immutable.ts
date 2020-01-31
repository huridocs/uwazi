/** @format */

export type IImmutable<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends null
  ? null
  : T extends undefined
  ? undefined
  : T extends Array<infer Elem>
  ? {
      toJS(): Elem[];
      get(i: number): IImmutable<Elem>;
      findIndex(fn: (e: IImmutable<Elem>) => boolean): number;
      filter(fn: (e: IImmutable<Elem>) => boolean): IImmutable<T>;
      find(fn: (e: IImmutable<Elem>) => boolean): IImmutable<Elem> | undefined;
      map<T2>(fn: (e: IImmutable<Elem>) => T2): IImmutable<T2[]>;
      reduce<R>(fn: (r: R, e: IImmutable<Elem>) => R, s: R): R;
    }
  : {
      toJS(): T;
      get<Field extends keyof T>(_field: Field): IImmutable<T[Field]>;
    };
