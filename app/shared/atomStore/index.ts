import { createStore } from 'jotai';
import { isClient } from '#app/utils/index.js';
import { getStore as getClientStore } from './client.store.js';
import { getStore as getServerStore } from './server.store.js';

type AtomStore = ReturnType<typeof createStore>;

const getStore = (): AtomStore =>
  isClient || process.env.NODE_ENV === 'test' ? getClientStore() : getServerStore();

export { getStore };
