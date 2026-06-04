import type { RouteMatch, RouteObject } from 'react-router';

const resolveLazyRoute = async (route: RouteObject): Promise<void> => {
  if (typeof route.lazy !== 'function') {
    return;
  }

  const lazyExports = await route.lazy();
  Object.assign(route, lazyExports);
  delete route.lazy;
};

export const resolveLazyForMatchChain = async (
  matches: RouteMatch[] | null | undefined
): Promise<void> => {
  if (!matches?.length) {
    return;
  }

  await Promise.all(matches.map(({ route }) => resolveLazyRoute(route)));
};
