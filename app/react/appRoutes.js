import { getRoutes } from './Routes';
import { settingsAtom, atomStore, userAtom } from './V2/atoms';

export const routes =
  getRoutes && getRoutes(atomStore.get(settingsAtom), atomStore.get(userAtom)?._id);
