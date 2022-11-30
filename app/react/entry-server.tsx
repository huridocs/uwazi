import { Request, Response } from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import {
  unstable_createStaticRouter as createStaticRouter,
  unstable_StaticRouterProvider as StaticRouterProvider,
} from 'react-router-dom/server';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import createStore from './store';
import App from './App';
import Root from './App/Root';
import settingsApi from '../api/settings/settings';
import { routes } from './Routes';

const getAssets = async () => {
  if (process.env.HOT) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/../../dist/webpack-assets.json`, (err, data) => {
      if (err) {
        reject(
          new Error(`${err}\nwebpack-assets.json do not exists or is malformed !,
                            you probably need to build webpack with the production configuration`)
        );
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
};

const EntryServer = async (req: Request, res: Response) => {
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
  const store = createStore({
    user: req.user,
    settings: globalResources.settings,
    translations: globalResources.translations,
    templates: globalResources.templates,
    thesauris: globalResources.thesauris,
    relationTypes: globalResources.relationTypes,
    locale: 'en',
  });

  // const componentHtml = ReactDOMServer.renderToString(
  //   <StaticRouter location={req.url}>
  //     <App />
  //   </StaticRouter>
  // );

  const router = createStaticRouter(routes, req);

  const componentHtml = ReactDOMServer.renderToString(
    <StaticRouterProvider router={router} context={req} nonce="the-nonce" />
  );

  const html = ReactDOMServer.renderToString(
    <Root
      language="en"
      content={componentHtml}
      head={Helmet.rewind()}
      user={req.user}
      reduxData={store.getState()}
      assets={assets}
    />
  );
  res.send(`<!DOCTYPE html>${html}`);
};

export { EntryServer };
