import { getRoutes } from './Routes.js';
import { settingsAtom, atomStore, userAtom } from '#V2/atoms/index.js';

let _routes;
export const getAppRoutes = () => {
  if (!_routes) {
    _routes = getRoutes?.(atomStore.get(settingsAtom), atomStore.get(userAtom)?._id);
  }
  return _routes;
};
