/* eslint-disable max-statements */
/* eslint-disable max-lines */
import type { Request as ExpressRequest, Response } from 'express';
import { join } from 'path';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import {
  createStaticHandler,
  createStaticRouter,
  matchRoutes,
  RouteObject,
  StaticHandlerContext,
  StaticRouterProvider,
} from 'react-router';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'jotai';
import omit from 'lodash/omit.js';
import sortBy from 'lodash/sortBy.js';
import { Provider as ReduxProvider } from 'react-redux';
import { getStore } from '#shared/atomStore/index.js';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import translationsApi, { IndexedTranslations } from '../api/i18n/translations.js';
import settingsApi from '../api/settings/settings.js';
import { tenants } from '../api/tenants/index.js';
import { CustomProvider } from './App/Provider.js';
import { Root } from './App/Root.js';
import { RouteHandler } from './App/RouteHandler.js';
import { ErrorBoundary } from './V2/Components/ErrorHandling/index.js';
import { ClientFeatureFlags } from './V2/shared/types.js';
import { hydrateAtomStore } from './V2/atoms/index.js';
import { I18NUtils } from './I18N/index.js';
import { IStore } from './istore.js';
import type { IndexComponents } from './Routes.js';
import { getRoutes } from './Routes.js';
import { create as createReduxStore } from './store.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { isMobileDevice } from '../shared/detectDevice.js';
import { loadIcons } from '#UI/Icon/library.js';

loadIcons();

api.APIURL(`http://localhost:${process.env.PORT || 3000}/api/`);

const ssrLog = (msg: string, data?: Record<string, unknown>) => {
  if (process.env.DEBUG_SSR) {
    const payload = data ? ` ${JSON.stringify(data)}` : '';
    // eslint-disable-next-line no-console
    console.log(`[SSR] ${msg}${payload}`);
  }
};

const describeElementType = (el: React.ReactNode): string => {
  if (el == null) return String(el);
  if (typeof el !== 'object') return typeof el;
  const elem = el as React.ReactElement & { $$typeof?: symbol };
  if (elem.$$typeof !== Symbol.for('react.element')) return 'not-element';
  const t = elem.type;
  if (typeof t === 'string') return `tag:${t}`;
  if (typeof t === 'function') {
    return `fn:${(t as { displayName?: string; name?: string }).displayName ?? (t as { name?: string }).name ?? '?'}`;
  }
  if (t != null && typeof t === 'object' && '$$typeof' in t) return 'memo/forwardRef';
  if (typeof t === 'object' && t !== null) return `object:${Object.keys(t as object).join(',')}`;
  return String(t);
};

class ServerRenderingFetchError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'ServerRenderingFetchError';
    this.stack = new Error().stack;
    this.status = 500;
  }
}

const onlySystemTranslations = (translations: IndexedTranslations[]) => {
  const rows = translations.map(translation => {
    const systemTranslation = translation?.contexts?.find(c => c.id === 'System');
    return { ...translation, contexts: [systemTranslation] };
  });

  return { json: { rows } };
};

const createFetchHeaders = (requestHeaders: ExpressRequest['headers']): Headers => {
  const headers = new Headers();

  Object.entries(requestHeaders).forEach(([key, values]) => {
    if (values) {
      if (Array.isArray(values)) {
        values.forEach(value => headers.append(key, value));
      } else {
        headers.set(key, values);
      }
    }
  });

  return headers;
};

const createFetchRequest = (
  req: ExpressRequest
): { fetchRequest: Request; ssrError: ServerRenderingFetchError | undefined } => {
  const origin = `${req.protocol}://${req.get('host')}`;
  let url;
  let ssrError;
  try {
    url = new URL(req.url, origin);
  } catch (e) {
    url = new URL(`${origin}/`);
    ssrError = new ServerRenderingFetchError(e.message);
  }
  const controller = new AbortController();

  req.on('close', () => {
    controller.abort();
  });

  const init: RequestInit = {
    method: req.method,
    headers: createFetchHeaders(req.headers),
    signal: controller.signal,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
  }

  return { fetchRequest: new Request(url.href, init), ssrError };
};

const getAssets = async () => {
  if (process.env.HOT) {
    return Promise.resolve();
  }

  const resolvedPath = join(process.cwd(), 'prod', 'dist', 'webpack-assets.json');
  return new Promise((resolve, reject) => {
    fs.readFile(resolvedPath, 'utf8', (err, data) => {
      if (err) {
        reject(
          new Error(`${err}\nwebpack-assets.json do not exists or is malformed !,
          \nyou probably need to build webpack with the production configuration`)
        );
      }
      try {
        resolve(JSON.parse(data.toString()));
      } catch (e) {
        reject(e);
      }
    });
  });
};

const prepareStores = async (req: ExpressRequest, settings: ClientSettings, language?: string) => {
  const locale = I18NUtils.getLocale(language, settings.languages, req.cookies);
  api.locale(locale);
  const headers = {
    'Content-Language': locale,
    Cookie: `connect.sid=${req.cookies['connect.sid']}`,
    tenant: req.get('tenant'),
  };

  const userAgent = req.get('user-agent') || '';

  const requestParams = new RequestParams({}, headers);

  const translations = await translationsApi.get();

  const [
    userApiResponse = { json: {} },
    settingsApiResponse = {
      json: {
        languages: settings.languages,
        private: settings.private,
        site_name: settings.site_name,
      },
    },
    templatesApiResponse = { json: { rows: [] } },
    thesaurisApiResponse = { json: { rows: [] } },
    relationTypesApiResponse = { json: { rows: [] } },
    translationsApiResponse = onlySystemTranslations(translations),
  ] =
    !settings.private || req.user
      ? await Promise.all([
          api.get('user', requestParams),
          api.get('settings', requestParams),
          api.get('templates', requestParams),
          api.get('dictionaries', requestParams),
          api.get('relationTypes', requestParams),
          Promise.resolve({ json: { rows: translations } }),
        ])
      : [];

  const reduxData = {
    user: userApiResponse.json,
    templates: sortBy(templatesApiResponse.json.rows, 'name'),
    thesauris: thesaurisApiResponse.json.rows,
    relationTypes: sortBy(relationTypesApiResponse.json.rows, 'name'),
    translations: translationsApiResponse.json.rows,
    settings: {
      collection: { ...settingsApiResponse.json, links: settingsApiResponse.json.links || [] },
    },
  };

  const reduxStore = createReduxStore({
    ...reduxData,
    locale,
  } as unknown as IStore);

  return {
    reduxStore,
    atomStoreData: {
      locale,
      settings: settingsApiResponse.json,
      thesauri: thesaurisApiResponse.json.rows,
      templates: templatesApiResponse.json.rows,
      user: userApiResponse.json,
      translations: translationsApiResponse.json.rows,
      relationTypes: sortBy(relationTypesApiResponse.json.rows, 'name'),
      isMobile: isMobileDevice(userAgent),
    },
  };
};

const setReduxState = async (
  req: ExpressRequest,
  reduxState: IStore,
  matched: { route: RouteObject; params: {} }[] | null
) => {
  let routeParams = {};
  const dataLoaders = matched
    ?.map(({ route, params }) => {
      routeParams = { ...routeParams, ...params };
      if (route.element) {
        const component = route.element as React.ReactElement & {
          type: { requestState: Function };
        };
        routeParams = { ...routeParams, ...component.props.params };
        if (component.props.children?.type?.requestState) {
          return component.props.children.type.requestState;
        }
        if (component.type.requestState) {
          return component.type.requestState;
        }
      }
      return null;
    })
    .filter(v => v);
  const initialStore = createReduxStore(reduxState);
  let loadingError: FetchResponseError | undefined;
  if (dataLoaders && dataLoaders.length > 0) {
    const headers = {
      'Content-Language': reduxState.locale,
      Cookie: `connect.sid=${req.cookies['connect.sid']}`,
      tenant: req.get('tenant'),
    };
    const requestParams = new RequestParams<{ q?: string }>(
      { ...req.query, ...omit(routeParams, 'lang') },
      headers
    );

    try {
      await Promise.all(
        dataLoaders.map(async loader => {
          const actions = await loader(requestParams, reduxState);
          if (Array.isArray(actions)) {
            actions.forEach(action => {
              initialStore.dispatch(action);
            });
          }
        })
      );
    } catch (e) {
      if (e instanceof FetchResponseError) {
        loadingError = e;
      } else {
        if (e.message) {
          throw new ServerRenderingFetchError(e.message);
        }
        throw e;
      }
    }
  }
  return { initialStore, initialState: initialStore.getState(), loadingError };
};

const prepareSSRContext = async (
  req: ExpressRequest,
  routes: RouteObject[],
  settings: ClientSettings,
  language?: string
) => {
  const { reduxStore, atomStoreData } = await prepareStores(req, settings, language);
  const { fetchRequest, ssrError } = createFetchRequest(req);
  const { query } = createStaticHandler(routes);
  const atomStore = getStore();
  hydrateAtomStore(atomStoreData, atomStore);
  const staticHandleContext = await query(fetchRequest);
  const router = createStaticRouter(routes, staticHandleContext as StaticHandlerContext);
  const reduxState = reduxStore.getState();

  return {
    reduxState,
    atomStoreData,
    staticHandleContext,
    router,
    ssrError,
    atomStore,
  };
};

const EntryServer = async (req: ExpressRequest, res: Response) => {
  ssrLog('request', { path: req.path });
  RouteHandler.renderedFromServer = true;
  ssrLog('fetching settings + assets');
  const [settings, assets] = await Promise.all([
    settingsApi.get() as Promise<ClientSettings>,
    getAssets(),
  ]);
  ssrLog('resolving AppShell');
  const { connection, ...headers } = req.headers;
  const AppShellMod = await import('./App/AppShell.js');
  const AppShellRaw =
    (AppShellMod as { AppShell?: Parameters<typeof getRoutes>[3] }).AppShell ??
    (AppShellMod as { default?: Parameters<typeof getRoutes>[3] }).default;
  const AppShell =
    typeof AppShellRaw === 'function'
      ? (AppShellRaw as Parameters<typeof getRoutes>[3])
      : undefined;
  ssrLog('AppShell resolved', { type: typeof AppShell });
  ssrLog('building routes');
  let indexComponents: IndexComponents | undefined;
  const [lib, cards, table, map, login] = await Promise.all([
    import('./Library/Library.js'),
    import('./Library/LibraryCards.js'),
    import('./Library/LibraryTable.js'),
    import('./Library/LibraryMap.js'),
    import('./Users/Login.js'),
  ]);
  indexComponents = {
    LibraryRoot: (lib as { LibraryRoot: IndexComponents['LibraryRoot'] }).LibraryRoot,
    LibraryCards: (cards as { LibraryCards: IndexComponents['LibraryCards'] }).LibraryCards,
    LibraryTable: (table as { LibraryTable: IndexComponents['LibraryTable'] }).LibraryTable,
    LibraryMap: (map as { LibraryMap: IndexComponents['LibraryMap'] }).LibraryMap,
    Login: (login as { Login: IndexComponents['Login'] }).Login,
  };
  const routes = getRoutes(settings, req.user && req.user._id, headers, AppShell, indexComponents);
  const matched = matchRoutes(routes, req.path);
  ssrLog('matchRoutes done', {
    path: req.path,
    matched: matched?.map((m, i) => ({
      i,
      pathname: m.pathname,
      routePath: m.route.path,
      elementType: describeElementType(m.route.element),
    })),
  });

  if (matched === null) {
    res.redirect('/404');
    return;
  }

  const lastRouteMatched = matched ? matched[matched.length - 1] : null;
  const lastRouteElement = lastRouteMatched?.route.element as React.ReactElement;

  const checkElementType = (el: React.ReactNode, path: string): void => {
    if (el == null || typeof el !== 'object') return;
    const elem = el as React.ReactElement & { $$typeof?: symbol };
    if (elem.$$typeof !== Symbol.for('react.element')) return;
    const t = elem.type;
    if (t == null) {
      throw new Error(
        `SSR: element.type is ${String(t)} at ${path}. ` +
          'The route component import is undefined (e.g. circular dependency or wrong export).'
      );
    }
    const valid =
      typeof t === 'string' ||
      typeof t === 'function' ||
      (typeof t === 'object' && '$$typeof' in t);
    if (!valid) {
      const keys = typeof t === 'object' && t !== null ? Object.keys(t).join(', ') : 'n/a';
      throw new Error(
        `SSR: invalid element type at ${path}: got ${typeof t}. ` +
          (keys !== 'n/a' ? `Keys: ${keys}. ` : '') +
          'Likely default/named import mismatch.'
      );
    }
    const props = elem.props as { children?: React.ReactNode };
    if (React.isValidElement(elem) && props?.children != null) {
      const children = Array.isArray(props.children) ? props.children : [props.children];
      children.forEach((child: React.ReactNode, i: number) =>
        checkElementType(child, `${path}.children[${i}]`)
      );
    }
  };
  matched!.forEach((m, i) => {
    const routeEl = m.route?.element as React.ReactNode;
    if (routeEl != null) {
      checkElementType(routeEl, `matched[${i}].route.path=${String(m.route.path)}.element`);
    }
  });
  ssrLog('checkElementType passed for all matched route elements');

  const isProtectedRoute = lastRouteElement.type === ProtectedRoute;

  if (isProtectedRoute) {
    const userId = req.user?._id;
    const userRole = req.user?.role || '';
    const { allowedRoles } = lastRouteElement.props;
    if (!userId || (allowedRoles && !allowedRoles.includes(userRole))) {
      res.redirect('/login');
      return;
    }
  }
  //extract the language from the route pathName, i.e /en/library
  const pathPossibleLanguage = lastRouteMatched?.pathname.split('/')[1] || '';

  const languageKeys = (settings?.languages?.map(lang => lang.key) as string[]) || [];
  const language = languageKeys.includes(pathPossibleLanguage)
    ? pathPossibleLanguage
    : req.language;

  const isCatchAll = matched ? matched[matched.length - 1].route.path === '*' : true;

  ssrLog('prepareSSRContext');
  const { reduxState, atomStoreData, staticHandleContext, router, ssrError, atomStore } =
    await prepareSSRContext(req, routes, settings, language);
  ssrLog('prepareSSRContext done', { ssrError: !!ssrError });

  const { globalMatomo, ciMatomoActive, featureFlags } = tenants.current();
  const clientFeatureFlags: ClientFeatureFlags = {
    paragraphExtraction: featureFlags?.paragraphExtraction,
  };
  ssrLog('setReduxState');
  const { initialStore, initialState, loadingError } = await setReduxState(
    req,
    reduxState,
    matched
  );
  ssrLog('setReduxState done', { loadingError: !!loadingError });

  const origCreateElement = React.createElement.bind(React);
  // @ts-expect-error - SSR diagnostic: throw with details when type is invalid
  React.createElement = function (type: React.ElementType, ...args: unknown[]) {
    if (type == null) {
      throw new Error(
        `SSR createElement called with type=${String(type)}. Stack: ${new Error().stack?.slice(0, 500)}`
      );
    }
    if (
      typeof type === 'object' &&
      typeof (type as { $$typeof?: unknown }).$$typeof === 'undefined'
    ) {
      const keys = Object.keys(type as object);
      throw new Error(
        `SSR createElement called with plain object. Keys: ${keys.join(', ') || 'none'}. ` +
          `Stack: ${new Error().stack?.slice(0, 600)}`
      );
    }
    return origCreateElement(type, ...args);
  };

  let componentHtml: string;
  ssrLog('renderToString (first pass: StaticRouterProvider)');
  try {
    componentHtml = ReactDOMServer.renderToString(
      <ReduxProvider store={initialStore as any}>
        <CustomProvider initialData={initialState} user={req.user} language={initialState.locale}>
          <Provider store={atomStore}>
            <React.StrictMode>
              <ErrorBoundary error={loadingError || ssrError}>
                <StaticRouterProvider
                  router={router}
                  context={staticHandleContext as any}
                  nonce="the-nonce"
                />
              </ErrorBoundary>
            </React.StrictMode>
          </Provider>
        </CustomProvider>
      </ReduxProvider>
    );
  } catch (e) {
    const err = e as Error & { componentStack?: string };
    ssrLog('renderToString FAILED', {
      message: err?.message,
      componentStack: err?.componentStack ?? '(none)',
      stack: err?.stack?.slice(0, 500),
    });
    if (err?.message?.includes('Element type is invalid')) {
      throw new Error(
        err.message + (err.componentStack ? `\nComponent stack:\n${err.componentStack}` : '')
      );
    }
    throw e;
  }
  ssrLog('renderToString (first pass) done');

  ssrLog('renderToString (second pass: Root)');
  const html = ReactDOMServer.renderToString(
    <Root
      language={atomStoreData.locale}
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={initialState}
      assets={assets}
      loadingError={loadingError || ssrError}
      featureFlags={clientFeatureFlags}
      atomStoreData={{ ...atomStoreData, ...(globalMatomo && { globalMatomo }), ciMatomoActive }}
    />
  );

  ssrLog('renderToString (second pass) done');
  const responseCode = loadingError?.status || (ssrError ? 500 : 200);
  const resStatus = isCatchAll ? 404 : responseCode;
  ssrLog('send response', { resStatus });
  res.status(resStatus).send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
