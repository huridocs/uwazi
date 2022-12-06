import { Request as ExpressRequest, Response } from 'express';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { matchRoutes, RouteObject } from 'react-router-dom';
import { Store } from 'redux';
import {
  unstable_createStaticRouter as createStaticRouter,
  unstable_StaticRouterProvider as StaticRouterProvider,
} from 'react-router-dom/server';
import {
  AgnosticDataRouteObject,
  unstable_createStaticHandler as createStaticHandler,
} from '@remix-run/router';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import settingsApi from '../api/settings/settings';
import Root from './App/Root';
import createStore from './store';
import { routes } from './Routes';
import CustomProvider from './App/Provider';
import { IStore } from './istore';
import { I18NUtils } from './I18N';

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

const prepareData = async (req: ExpressRequest, language: string) => {
  const [settings, assets] = await Promise.all([settingsApi.get(), getAssets()]);

  const locale = I18NUtils.getLocale(language, settings.languages, req.cookies);

  const headers = {
    'Content-Language': locale,
    Cookie: `connect.sid=${req.cookies['connect.sid']}`,
    tenant: req.get('tenant'),
  };

  const requestParams = new RequestParams({}, headers);

  api.APIURL('http://localhost:3000/api/');

  const [user, translations, templates, thesauris, relationTypes] = await Promise.all([
    api.get('user', requestParams),
    api.get('translations', requestParams),
    api.get('templates', requestParams),
    api.get('thesauris', requestParams),
    api.get('relationTypes', requestParams),
  ]);

  const globalResources = {
    user: user.json,
    translations: translations.json.rows,
    templates: templates.json.rows,
    thesauris: thesauris.json.rows,
    relationTypes: relationTypes.json.rows,
    settings: { collection: settings },
  };

  settings.links = settings.links || [];

  const reduxStore = createStore({
    user: req.user,
    settings: globalResources.settings,
    translations: globalResources.translations,
    templates: globalResources.templates,
    thesauris: globalResources.thesauris,
    relationTypes: globalResources.relationTypes,
    locale,
  });

  return { reduxStore, assets };
};

const setReduxState = async (
  req: ExpressRequest,
  reduxStore: Store<IStore>,
  reduxState: IStore,
  matched: { route: RouteObject }[] | null
) => {
  const dataLoaders = matched
    ?.map(({ route }) => {
      if (route.element) {
        const component = route.element as React.ReactElement;
        if (component.props.children?.type.requestState) {
          return component.props.children?.type.requestState;
        }
        if (component.type.requestState) {
          return component.type.requestState;
        }
      }
      return null;
    })
    .filter(v => v);

  if (dataLoaders && dataLoaders.length > 0) {
    const headers = {
      'Content-Language': reduxState.locale,
      Cookie: `connect.sid=${req.cookies['connect.sid']}`,
      tenant: req.get('tenant'),
    };
    const requestParams = new RequestParams({ ...req.query, ...req.params }, headers);

    await Promise.all(
      dataLoaders.map(async loader => {
        const actions = await loader({ params: req.params, request: requestParams }, reduxState);
        if (Array.isArray(actions)) {
          actions.forEach(action => {
            reduxStore.dispatch(action);
          });
        }
      })
    );
  }
};

const getSSRProperties = async (req: ExpressRequest, language: string) => {
  const { reduxStore, assets } = await prepareData(req, language);
  const { query } = createStaticHandler(routes as AgnosticDataRouteObject[]);
  const staticHandleContext = await query(createFetchRequest(req));
  const router = createStaticRouter(routes, staticHandleContext);

  return {
    reduxStore,
    assets,
    staticHandleContext,
    router,
  };
};

const EntryServer = async (req: ExpressRequest, res: Response) => {
  const matched = matchRoutes(routes, req.path);
  const language = matched ? matched[0].params.lang : req.language;

  const { reduxStore, assets, staticHandleContext, router } = await getSSRProperties(
    req,
    language || 'en'
  );

  const reduxState = reduxStore.getState();

  await setReduxState(req, reduxStore, reduxState, matched);

  const componentHtml = ReactDOMServer.renderToString(
    <Provider store={reduxStore}>
      <CustomProvider initialData={reduxState} user={req.user} language={reduxState.locale}>
        <React.StrictMode>
          <StaticRouterProvider router={router} context={staticHandleContext} nonce="the-nonce" />
        </React.StrictMode>
      </CustomProvider>
    </Provider>
  );

  const html = ReactDOMServer.renderToString(
    <Root
      language={reduxState.locale}
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={reduxState}
      assets={assets}
    />
  );
  res.send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
