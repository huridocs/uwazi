import type { Collection } from 'immutable';

declare const Immutable: {
  fromJS: (json: unknown) => Collection<unknown, unknown>;
  [key: string]: unknown;
};

export { Immutable };
