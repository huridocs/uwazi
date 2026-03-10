import { getStore } from 'shared/atomStore';
import { getRoutes } from './Routes';
import { settingsAtom, userAtom } from './V2/atoms';

export const routes =
  getRoutes && getRoutes(getStore().get(settingsAtom), getStore().get(userAtom)?._id);
