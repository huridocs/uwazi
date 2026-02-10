import { createStore } from 'jotai';
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<ReturnType<typeof createStore>>();

const runWithStore = <T>(fn: () => T) => asyncLocalStorage.run(createStore(), fn);

const getStore = (): ReturnType<typeof createStore> => {
  const store = asyncLocalStorage.getStore();
  const fallback = createStore();
  return store || fallback;
};

export { runWithStore, getStore };
