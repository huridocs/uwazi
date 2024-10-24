/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { Request as ExpressRequest, Response } from 'express';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { AgnosticDataRouteObject, createStaticHandler } from '@remix-run/router';
import { matchRoutes, RouteObject } from 'react-router-dom';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'jotai';
import { omit, isEmpty } from 'lodash';
import { Provider as ReduxProvider } from 'react-redux';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { createStaticRouter, StaticRouterProvider } from 'react-router-dom/server';
import { FetchResponseError } from 'shared/JSONRequest';
import { ClientSettings } from 'app/apiResponseTypes';
import translationsApi, { IndexedTranslations } from '../api/i18n/translations';
import settingsApi from '../api/settings/settings';
import { tenants } from '../api/tenants';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import RouteHandler from './App/RouteHandler';
import { ErrorBoundary } from './V2/Components/ErrorHandling';
import { atomStore, hydrateAtomStore } from './V2/atoms';
import { I18NUtils, t, Translate } from './I18N';
import { IStore } from './istore';
import { getRoutes } from './Routes';
import createReduxStore from './store';

api.APIURL(`http://localhost:${process.env.PORT || 3000}/api/`);

class ServerRenderingFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerRenderingFetchError';
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

const createFetchRequest = (req: ExpressRequest): Request => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const url = new URL(req.url, origin);

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

  return new Request(url.href, init);
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

  const requestParams = new RequestParams({}, headers);

  const translations = await translationsApi.get();

  const [
    userApiResponse = { json: {} },
    settingsApiResponse = { json: { languages: [], private: settings.private } },
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
          api.get('thesauris', requestParams),
          api.get('relationTypes', requestParams),
          Promise.resolve({ json: { rows: translations } }),
        ])
      : [];

  const reduxData = {
    user: userApiResponse.json,
    translations: translationsApiResponse.json.rows,
    templates: templatesApiResponse.json.rows,
    thesauris: thesaurisApiResponse.json.rows,
    relationTypes: relationTypesApiResponse.json.rows,
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

    if (requestParams.data && !isEmpty(requestParams.data) && requestParams.data.q) {
      requestParams.data.q = decodeURI(requestParams.data.q);
    }

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

const getSSRProperties = async (
  req: ExpressRequest,
  routes: RouteObject[],
  settings: ClientSettings,
  language?: string
) => {
  const { reduxStore, atomStoreData } = await prepareStores(req, settings, language);
  const { query } = createStaticHandler(routes as AgnosticDataRouteObject[]);
  const staticHandleContext = await query(createFetchRequest(req));
  const router = createStaticRouter(routes, staticHandleContext as any);
  const reduxState = reduxStore.getState();

  return {
    reduxState,
    atomStoreData,
    staticHandleContext,
    router,
  };
};

const resetTranslations = () => {
  t.resetCachedTranslation();
  Translate.resetCachedTranslation();
};

const EntryServer = async (req: ExpressRequest, res: Response) => {
  RouteHandler.renderedFromServer = true;
  const [settings, assets] = await Promise.all([
    settingsApi.get() as Promise<ClientSettings>,
    getAssets(),
  ]);
  //https://github.com/trpc/trpc/issues/1811#issuecomment-1242222057
  //for Node18 we have to remove the connection header
  const { connection, ...headers } = req.headers;
  const routes = getRoutes(settings, req.user && req.user._id, headers);
  const matched = matchRoutes(routes, req.path);
  const lastRouteMatched = matched ? matched[matched.length - 1] : null;
  //extract the language from the route pathName, i.e /en/library
  const pathPossibleLanguage = lastRouteMatched?.pathname.split('/')[1] || '';

  const languageKeys = (settings?.languages?.map(lang => lang.key) as string[]) || [];
  const language = languageKeys.includes(pathPossibleLanguage)
    ? pathPossibleLanguage
    : req.language;
  const isCatchAll = matched ? matched[matched.length - 1].route.path === '*' : true;

  const { reduxState, atomStoreData, staticHandleContext, router } = await getSSRProperties(
    req,
    routes,
    settings,
    language
  );

  const { globalMatomo, ciMatomoActive } = tenants.current();
  const { initialStore, initialState, loadingError } = await setReduxState(
    req,
    reduxState,
    matched
  );
  resetTranslations();
  hydrateAtomStore(atomStoreData);
  const componentHtml = ReactDOMServer.renderToString(
    <ReduxProvider store={initialStore as any}>
      <CustomProvider initialData={initialState} user={req.user} language={initialState.locale}>
        <Provider store={atomStore}>
          <React.StrictMode>
            <ErrorBoundary error={loadingError}>
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

  const html = ReactDOMServer.renderToString(
    <Root
      language={atomStoreData.locale}
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={initialState}
      assets={assets}
      loadingError={loadingError}
      atomStoreData={{ ...atomStoreData, ...(globalMatomo && { globalMatomo }), ciMatomoActive }}
    />
  );

  const responseCode = loadingError?.status || 200;
  const resStatus = isCatchAll ? 404 : responseCode;
  res.status(resStatus).send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
