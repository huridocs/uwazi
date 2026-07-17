/* eslint-disable max-statements */
/* eslint-disable max-lines */
import type { Request as ExpressRequest, Response } from 'express';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { apiClient } from '#V2/api/client.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import templatesApi from '#api/core/v1_layer/templates/templates.js';
import thesauriApi from '../api/core/v1_layer/thesauri/thesauri.js';
import relationtypes from '../api/relationtypes/relationtypes.js';
import translationsApi, { IndexedTranslations } from '../api/i18n/translations.js';
import settingsApi from '../api/settings/settings.js';
import { tenants } from '../api/tenants/index.js';
import { CustomProvider } from './App/Provider.js';
import { Root } from './App/Root.js';
import { RouteHandler } from './App/RouteHandler.js';
import { ErrorBoundary } from './V2/Components/ErrorHandling/index.js';
import { hydrateAtomStore } from './V2/atoms/index.js';
import { I18NUtils } from './I18N/index.js';
import { IStore } from './istore.js';
import type { IndexComponents } from './Routes.js';
import { getRoutes } from './Routes.js';
import { createServerServices } from '#V2/services/server/index.js';
import { create as createReduxStore } from './store.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { isMobileDevice } from '../shared/detectDevice.js';
import { loadIcons } from '#UI/Icon/library.js';
import type { ClientFeatureFlags } from '#V2/shared/types.js';

loadIcons();

const convertObjectIdsToStrings = (data: any) => JSON.parse(JSON.stringify(data));

api.APIURL(`http://localhost:${process.env.PORT || 3000}/api/`);
apiClient.setBaseUrl(`http://localhost:${process.env.PORT || 3000}/api/`);

class ServerRenderingFetchError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'ServerRenderingFetchError';
    this.stack = new Error().stack;
    this.status = 500;
  }
}

const onlySystemTranslations = (translations: IndexedTranslations[]) =>
  translations.map(translation => {
    const systemTranslation = translation?.contexts?.find(c => c.id === 'System');
    return { ...translation, contexts: [systemTranslation] };
  });

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
  const now = process.hrtime.bigint();
  const elapsedMs = Math.round(Number(now - ssrStart) / 1_000_000);

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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
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
  const userAgent = req.get('user-agent') || '';

  const translations = await translationsApi.get();

  const [
    userApiResponse = {},
    settingsApiResponse = {
      languages: settings.languages,
      private: settings.private,
      site_name: settings.site_name,
    },
    templatesApiResponse = [],
    thesaurisApiResponse = [],
    relationTypesApiResponse = [],
    translationsApiResponse = onlySystemTranslations(translations),
  ] =
    !settings.private || req.user
      ? await Promise.all([
          Promise.resolve(req.user || {}),
          Promise.resolve(settings),
          templatesApi.get(),
          thesauriApi.dictionaries(),
          relationtypes.get(),
          Promise.resolve(translations),
        ])
      : [];

  const themeCustomization = tenants.current().featureFlags?.themeCustomization ?? false;
  const settingsWithFlag = { ...settingsApiResponse, themeCustomization };

  const storeData = convertObjectIdsToStrings({
    reduxData: {
      user: userApiResponse,
      templates: sortBy(templatesApiResponse, 'name'),
      thesauris: thesaurisApiResponse,
      relationTypes: sortBy(relationTypesApiResponse, 'name'),
      translations: translationsApiResponse,
      settings: {
        collection: { ...settingsWithFlag, links: settingsWithFlag.links || [] },
      },
    },
    atomStoreData: {
      locale,
      settings: settingsWithFlag,
      thesauri: thesaurisApiResponse,
      templates: templatesApiResponse,
      user: userApiResponse,
      translations: translationsApiResponse,
      relationTypes: sortBy(relationTypesApiResponse, 'name'),
      isMobile: isMobileDevice(userAgent),
    },
  });

  const reduxStore = createReduxStore({
    ...storeData.reduxData,
    locale,
  } as unknown as IStore);

  return { reduxStore, atomStoreData: storeData.atomStoreData };
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

const prepareStoreData = async (
  req: ExpressRequest,
  settings: ClientSettings,
  language?: string
) => {
  const { reduxStore, atomStoreData } = await prepareStores(req, settings, language);

  const atomStore = getStore();
  hydrateAtomStore(atomStoreData as any, atomStore);
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
  RouteHandler.renderedFromServer = true;
  const [settings, assets] = await Promise.all([
    settingsApi.get() as Promise<ClientSettings>,
    getAssets(),
  ]);
  const { connection, ...headers } = req.headers;

  const [lib, cards, table, map, login] = await Promise.all([
    import('./Library/Library.js'),
    import('./Library/LibraryCards.js'),
    import('./Library/LibraryTable.js'),
    import('./Library/LibraryMap.js'),
    import('./Users/Login.js'),
  ]);

  const indexComponents: IndexComponents | undefined = {
    LibraryRoot: (lib as { LibraryRoot: IndexComponents['LibraryRoot'] }).LibraryRoot,
    LibraryCards: (cards as { LibraryCards: IndexComponents['LibraryCards'] }).LibraryCards,
    LibraryTable: (table as { LibraryTable: IndexComponents['LibraryTable'] }).LibraryTable,
    LibraryMap: (map as { LibraryMap: IndexComponents['LibraryMap'] }).LibraryMap,
    Login: (login as { Login: IndexComponents['Login'] }).Login,
  };

  const serverServices = createServerServices(req);
  const routes = getRoutes(
    settings,
    req.user && req.user._id,
    headers,
    indexComponents,
    serverServices
  );

  const matched = matchRoutes(routes, req.path);

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
  const { globalMatomo, ciMatomoActive, featureFlags } = tenants.current();
  const clientFeatureFlags: ClientFeatureFlags = {
    paragraphExtraction: featureFlags?.paragraphExtraction,
    v2CSVImport: featureFlags?.v2CSVImport,
    dataViz: featureFlags?.dataViz,
    newHeader: featureFlags?.newHeader,
    themeCustomization: featureFlags?.themeCustomization,
    aiAssistant: featureFlags?.aiAssistant,
  };
  const settingsWithFeatureFlags = {
    ...settings,
    features: {
      ...(settings.features || {}),
      ...clientFeatureFlags,
    },
  };

  if (req.aborted) {
    logSSRAborted(req, 'Store data', ssrStart, routeName);
    return;
  }

  const { reduxState, atomStore, atomStoreData } = await prepareStoreData(
    req,
    settingsWithFeatureFlags,
    language
  );

  if (req.aborted) {
    logSSRAborted(req, 'Route data', ssrStart, routeName);
    return;
  }

  const { staticHandleContext, router, ssrError } = await prepareRouteData(req, routes);

  if (req.aborted) {
    logSSRAborted(req, 'Before requestStates', ssrStart, routeName);
    return;
  }
  const { initialStore, initialState, loadingError } = await setReduxState(
    req,
    reduxState,
    matched
  );

  const resolvedLoadingError = loadingError;

  const pageCssRaw = initialState.page?.pageView?.toJS?.()?.metadata?.css;
  const documentHeadPageCss =
    typeof pageCssRaw === 'string' && pageCssRaw.trim() ? pageCssRaw : undefined;

  if (req.aborted) {
    logSSRAborted(req, 'Component HTML', ssrStart, routeName);
    return;
  }

  const componentHtml = ReactDOMServer.renderToString(
    <ReduxProvider store={initialStore as any}>
      <CustomProvider initialData={initialState} user={req.user} language={initialState.locale}>
        <Provider store={atomStore}>
          <React.StrictMode>
            <ErrorBoundary error={resolvedLoadingError || ssrError}>
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

  if (req.aborted) {
    logSSRAborted(req, 'Root HTML', ssrStart, routeName);
    return;
  }
  const html = ReactDOMServer.renderToString(
    <Root
      language={atomStoreData.locale}
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={initialState}
      documentHeadPageCss={documentHeadPageCss}
      assets={assets}
      loadingError={resolvedLoadingError || ssrError}
      featureFlags={clientFeatureFlags}
      atomStoreData={{ ...atomStoreData, ...(globalMatomo && { globalMatomo }), ciMatomoActive }}
    />
  );

  if (req.aborted) {
    logSSRAborted(req, 'Aborted before response', ssrStart, routeName);
    return;
  }
  const responseCode = resolvedLoadingError?.status || (ssrError ? 500 : 200);
  const resStatus = isCatchAll ? 404 : responseCode;
  res.status(resStatus).send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
