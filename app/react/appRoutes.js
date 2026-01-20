const isClient = typeof window !== 'undefined';

let routesCache = null;

const initializeRoutes = async () => {
  if (routesCache === null) {
    if (isClient) {
      const { settingsAtom, atomStore, userAtom } = await import('#V2/atoms/index.js');
      const { getRoutes } = await import('#app/Routes.jsx');
      routesCache = getRoutes(atomStore.get(settingsAtom), atomStore.get(userAtom)?._id);
    } else {
      routesCache = [];
    }
  }
  return routesCache;
};

export const routes = await initializeRoutes();
