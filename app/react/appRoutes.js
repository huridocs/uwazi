import { getStore } from '#shared/atomStore/index.js';
import { getRoutes } from './Routes.js';
import { settingsAtom, userAtom } from './V2/atoms/index.js';

let _routes;
export const getAppRoutes = () => {
  if (!_routes) {
    _routes = getRoutes?.({
      settings: getStore().get(settingsAtom),
      userId: getStore().get(userAtom)?._id,
    });
  }
  return _routes;
};
