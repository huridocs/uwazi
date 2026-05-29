import { getStore } from '#shared/atomStore/index.js';
import { getRoutes } from './Routes.js';
import { settingsAtom, userAtom } from './V2/atoms/index.js';

let _routes;
export const getAppRoutes = () => {
  if (process.env.HOT || !_routes) {
    _routes = getRoutes?.(getStore().get(settingsAtom), getStore().get(userAtom)?._id);
  }
  return _routes;
};

if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept('./Routes.tsx', () => {
    _routes = getRoutes?.(getStore().get(settingsAtom), getStore().get(userAtom)?._id);
  });
}
