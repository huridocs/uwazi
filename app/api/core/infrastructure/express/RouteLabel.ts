import { Request, Response } from 'express';

const EXCLUDED_ROUTES = ['/api/version', '/metrics'];

const NOT_FOUND_LABEL = 'not_found';
const STATIC_ASSET_LABEL = 'static_asset';

const STATIC_ASSET_RE = /\.[a-z0-9]+$/i;

type RouteKind = 'ssr' | 'static_asset' | 'not_found' | 'backend';

type RouteInfo = {
  label: string;
  kind: RouteKind;
};

const getSSRRouteLabel = (path: string): string => {
  const [, firstSegment, secondSegment] = path.match(/^\/([^/]*)\/?([^/]*)/i) || [];

  const section = /^[a-z]{2}$/i.test(firstSegment) ? secondSegment : firstSegment;

  return section ? section.toLowerCase() : 'home';
};

const isStaticAssetPath = (path: string) =>
  path.startsWith('/public/') || path.startsWith('/flag-images/') || STATIC_ASSET_RE.test(path);

const getRouteInfo = (request: Request, response: Response): RouteInfo | undefined => {
  const routePath = request.route?.path;

  if (typeof routePath === 'string') {
    return EXCLUDED_ROUTES.includes(routePath) ? undefined : { label: routePath, kind: 'backend' };
  }

  if (response.statusCode === 404) return { label: NOT_FOUND_LABEL, kind: 'not_found' };

  if (isStaticAssetPath(request.path)) return { label: STATIC_ASSET_LABEL, kind: 'static_asset' };

  if (routePath) {
    return { label: request.ssrRoutePattern || getSSRRouteLabel(request.path), kind: 'ssr' };
  }

  return undefined;
};

export { getRouteInfo, getSSRRouteLabel, isStaticAssetPath };
export type { RouteKind, RouteInfo };
