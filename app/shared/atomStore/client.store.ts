import { createStore } from 'jotai';

const store = createStore();

const getStore = (): ReturnType<typeof createStore> => store;

export { getStore };
