/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { Request as ExpressRequest, Response } from 'express';
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
import { omit, sortBy } from 'lodash';
import { Provider as ReduxProvider } from 'react-redux';
import { getStore } from 'shared/atomStore';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { FetchResponseError } from 'shared/JSONRequest';
import { ClientSettings } from 'app/apiResponseTypes';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import translationsApi, { IndexedTranslations } from '../api/i18n/translations';
import settingsApi from '../api/settings/settings';
import { tenants } from '../api/tenants';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import RouteHandler from './App/RouteHandler';
import { ErrorBoundary } from './V2/Components/ErrorHandling';
import { ClientFeatureFlags } from './V2/shared/types';
import { hydrateAtomStore } from './V2/atoms';
import { I18NUtils } from './I18N';
import { IStore } from './istore';
import { getRoutes } from './Routes';
import createReduxStore from './store';
import { ProtectedRoute } from './ProtectedRoute';
import { isMobileDevice } from '../shared/detectDevice';

api.APIURL(`http://localhost:${process.env.PORT || 3000}/api/`);

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

const logSSRAborted = (req: ExpressRequest, step: string, ssrStart: bigint, routeName?: string) => {
  let elapsedMs: number | undefined;

  const now = process.hrtime.bigint();
  elapsedMs = Math.round(Number(now - ssrStart) / 1_000_000);

  LoggerFactory.default().debug('SSR Aborted', {
    aborted: req.aborted,
    url: req.url,
    step,
    elapsedMs,
    routeName,
  });
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

  return new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/../../dist/webpack-assets.json`, (err, data) => {
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

  const globalResourcesStart = performance.now();
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
  console.log(
    '[PERF][SSR] Global resources fetch:',
    (performance.now() - globalResourcesStart).toFixed(2),
    'ms'
  );
  console.log(
    '[PERF][SSR] Templates count:',
    templatesApiResponse.json.rows.length,
    '- Thesauri count:',
    thesaurisApiResponse.json.rows.length,
    '- RelationTypes count:',
    relationTypesApiResponse.json.rows.length
  );

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
  });

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
  const extractStart = performance.now();
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
  console.log(
    '[PERF][SSR] Component extraction:',
    (performance.now() - extractStart).toFixed(2),
    'ms',
    '- Data loaders count:',
    dataLoaders?.length || 0
  );
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
        dataLoaders.map(async (loader, index) => {
          const loaderStart = performance.now();
          const actions = await loader(requestParams, reduxState);
          const loaderTime = (performance.now() - loaderStart).toFixed(2);
          console.log(
            `[PERF][SSR] Data loader ${index} execution:`,
            loaderTime,
            'ms',
            '- Actions count:',
            Array.isArray(actions) ? actions.length : 0
          );
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

const prepareStoreData = async (
  req: ExpressRequest,
  settings: ClientSettings,
  language?: string
) => {
  const { reduxStore, atomStoreData } = await prepareStores(req, settings, language);

  const atomStore = getStore();
  hydrateAtomStore(atomStoreData, atomStore);
  const reduxState = reduxStore.getState();

  return {
    reduxState,
    atomStore,
    atomStoreData,
  };
};

const prepareRouteData = async (req: ExpressRequest, routes: RouteObject[]) => {
  const { fetchRequest, ssrError } = createFetchRequest(req);
  const { query } = createStaticHandler(routes);
  const staticHandleContext = await query(fetchRequest);
  const router = createStaticRouter(routes, staticHandleContext as StaticHandlerContext);

  return {
    staticHandleContext,
    router,
    ssrError,
  };
};

const EntryServer = async (req: ExpressRequest, res: Response) => {
  const ssrStart = process.hrtime.bigint();
  const perfStart = performance.now();
  RouteHandler.renderedFromServer = true;
  const [settings, assets] = await Promise.all([
    settingsApi.get() as Promise<ClientSettings>,
    getAssets(),
  ]);
  console.log(
    '[PERF][SSR] Settings & assets loaded:',
    (performance.now() - perfStart).toFixed(2),
    'ms'
  );
  //https://github.com/trpc/trpc/issues/1811#issuecomment-1242222057
  //for Node18 we have to remove the connection header
  const { connection, ...headers } = req.headers;
  const routeMatchStart = performance.now();
  const routes = getRoutes(settings, req.user && req.user._id, headers);
  const matched = matchRoutes(routes, req.path);
  console.log(
    '[PERF][SSR] Route matching:',
    (performance.now() - routeMatchStart).toFixed(2),
    'ms'
  );

  if (matched === null) {
    res.redirect('/404');
    return;
  }

  if (req.aborted) {
    logSSRAborted(req, 'Matching routes', ssrStart);
    return;
  }

  const lastRouteMatched = matched ? matched[matched.length - 1] : null;
  const lastRouteElement = lastRouteMatched?.route.element as React.ReactElement | undefined;
  const isProtectedRoute = lastRouteElement?.type === ProtectedRoute;
  const routeName = lastRouteMatched?.route?.path || 'library';

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

  if (req.aborted) {
    logSSRAborted(req, 'Store data', ssrStart, routeName);
    return;
  }

  const storeDataStart = performance.now();
  const { reduxState, atomStore, atomStoreData } = await prepareStoreData(req, settings, language);
  console.log(
    '[PERF][SSR] Store data preparation:',
    (performance.now() - storeDataStart).toFixed(2),
    'ms'
  );

  if (req.aborted) {
    logSSRAborted(req, 'Route data', ssrStart, routeName);
    return;
  }

  const { staticHandleContext, router, ssrError } = await prepareRouteData(req, routes);

  const { globalMatomo, ciMatomoActive, featureFlags } = tenants.current();
  const clientFeatureFlags: ClientFeatureFlags = {
    paragraphExtraction: featureFlags?.paragraphExtraction,
  };

  if (req.aborted) {
    logSSRAborted(req, 'Before requestStates', ssrStart, routeName);
    return;
  }

  const requestStateStart = performance.now();
  const { initialStore, initialState, loadingError } = await setReduxState(
    req,
    reduxState,
    matched
  );
  console.log(
    '[PERF][SSR] RequestState execution:',
    (performance.now() - requestStateStart).toFixed(2),
    'ms'
  );

  if (req.aborted) {
    logSSRAborted(req, 'Component HTML', ssrStart, routeName);
    return;
  }

  const componentRenderStart = performance.now();
  const componentHtml = ReactDOMServer.renderToString(
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
  console.log(
    '[PERF][SSR] React component rendering:',
    (performance.now() - componentRenderStart).toFixed(2),
    'ms'
  );

  if (req.aborted) {
    logSSRAborted(req, 'Root HTML', ssrStart, routeName);
    return;
  }

  const htmlRenderStart = performance.now();
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
  console.log(
    '[PERF][SSR] HTML document rendering:',
    (performance.now() - htmlRenderStart).toFixed(2),
    'ms'
  );

  if (req.aborted) {
    logSSRAborted(req, 'Aborted before response', ssrStart, routeName);
    return;
  }

  const responseCode = loadingError?.status || (ssrError ? 500 : 200);
  const resStatus = isCatchAll ? 404 : responseCode;
  const totalSSRTime = (performance.now() - perfStart).toFixed(2);
  console.log(
    '[PERF][SSR] TOTAL SSR TIME:',
    totalSSRTime,
    'ms',
    '- Route:',
    routeName,
    '- Status:',
    resStatus
  );
  res.status(resStatus).send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
