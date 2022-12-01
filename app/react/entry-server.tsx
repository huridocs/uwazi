import { Request as ExpressRequest, Response } from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import {
  unstable_createStaticRouter as createStaticRouter,
  unstable_StaticRouterProvider as StaticRouterProvider,
} from 'react-router-dom/server';
import {
  AgnosticDataRouteObject,
  unstable_createStaticHandler as createStaticHandler,
} from '@remix-run/router';
import api from 'app/utils/api';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { RequestParams } from 'app/utils/RequestParams';
import settingsApi from '../api/settings/settings';
import Root from './App/Root';
import createStore from './store';
import { createRoutes } from './Routes';
import CustomProvider from './App/Provider';

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

const prepareData = async (req: ExpressRequest) => {
  const [settings, assets] = await Promise.all([settingsApi.get(), getAssets()]);

  const headers = {
    'Content-Language': 'en',
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

  const globalStore = createStore({
    user: req.user,
    settings: globalResources.settings,
    translations: globalResources.translations,
    templates: globalResources.templates,
    thesauris: globalResources.thesauris,
    relationTypes: globalResources.relationTypes,
    locale: 'en',
  });

  return { globalResources, globalStore, assets };
};

const EntryServer = async (req: ExpressRequest, res: Response) => {
  const { globalResources, globalStore, assets } = await prepareData(req);
  const routes = createRoutes(globalResources);
  const { dataRoutes, query } = createStaticHandler(routes as AgnosticDataRouteObject[]);

  const state = await query(createFetchRequest(req));
  const router = createStaticRouter(routes, state);

  const componentHtml = ReactDOMServer.renderToString(
    <Provider store={globalStore}>
      <CustomProvider>
        <React.StrictMode>
          <StaticRouterProvider router={router} context={state} nonce="the-nonce" />
        </React.StrictMode>
      </CustomProvider>
    </Provider>
  );

  const html = ReactDOMServer.renderToString(
    <Root
      language="en"
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={globalStore.getState()}
      assets={assets}
    />
  );
  res.send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
