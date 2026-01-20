import Immutable from 'immutable';

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
            ? Immutable.List<IImmutable<Elem>>
            : {
                toJS(): T;
                get<Field extends keyof T>(_field: Field): IImmutable<T[Field]>;
                filter(
                  fn: (listElement: IImmutable<T>) => boolean | undefined
                ): Immutable.List<IImmutable<T>>;
              };
