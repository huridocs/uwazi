import { atom, createStore } from 'jotai';
import { PAGE_PARAM, VIEW_MODE_PARAM } from './urlParams.js';

type EntityUrlAtomStore = ReturnType<typeof createStore>;

const entityPageAtom = atom('1');

const parseEntityHash = (hash: string = ''): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const serializeEntityHash = (params: URLSearchParams): string => {
  const str = params.toString();
  return str ? `#${str}` : '';
};

const stripSearch = (search: string) => (search.startsWith('?') ? search.slice(1) : search);

const splitEntityHash = (hash: string) => {
  const params = parseEntityHash(hash);
  const page = params.get(PAGE_PARAM) || '1';
  const raw = params.get(VIEW_MODE_PARAM) === 'true';
  params.delete(PAGE_PARAM);
  params.delete(VIEW_MODE_PARAM);
  return { page, raw, ui: params.toString() };
};

const setEntityPageAtom = (page: string, store: EntityUrlAtomStore) => {
  if (store.get(entityPageAtom) !== page) {
    store.set(entityPageAtom, page);
  }
};

export {
  entityPageAtom,
  parseEntityHash,
  serializeEntityHash,
  stripSearch,
  splitEntityHash,
  setEntityPageAtom,
};
export type { EntityUrlAtomStore };
