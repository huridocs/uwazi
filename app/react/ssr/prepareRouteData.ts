import {
  createStaticHandler,
  createStaticRouter,
  type RouteObject,
  type StaticHandlerContext,
} from 'react-router';

type PreparedRouteData =
  | {
      kind: 'render';
      staticHandleContext: StaticHandlerContext;
      router: ReturnType<typeof createStaticRouter>;
    }
  | {
      kind: 'response';
      response: Response;
    };

const requestWithAbortSignal = (fetchRequest: Request): Request => {
  if (fetchRequest.signal) {
    return fetchRequest;
  }
  return new Request(fetchRequest, { signal: new AbortController().signal });
};

const prepareRouteData = async (
  fetchRequest: Request,
  routes: RouteObject[]
): Promise<PreparedRouteData> => {
  const { query } = createStaticHandler(routes);
  const staticHandleContext = await query(requestWithAbortSignal(fetchRequest));
  if (staticHandleContext instanceof Response) {
    return {
      kind: 'response',
      response: staticHandleContext,
    };
  }

  return {
    kind: 'render',
    staticHandleContext,
    router: createStaticRouter(routes, staticHandleContext),
  };
};

export { prepareRouteData };
export type { PreparedRouteData };
