import { createStore } from 'jotai';

const fallbackStore = createStore();

const runWithStore = <T>(fn: () => T): T => fn();

const getStore = (): ReturnType<typeof createStore> => fallbackStore;

export { runWithStore, getStore };
