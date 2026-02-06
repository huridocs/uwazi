import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { getStore as getClientStore } from './client.store';
import { getStore as getServerStore } from './server.store';

type AtomStore = ReturnType<typeof createStore>;

const getStore = (): AtomStore => (isClient ? getClientStore() : getServerStore());

export { getStore };
