import { Request, Response } from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { StaticRouter } from 'react-router-dom/server';
import createStore from './store';
import App from './App';
import Root from './App/Root';
import settingsApi from '../api/settings/settings';

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

  const store = createStore({
    user: req.user,
    settings: { collection: settings },
    translations: [],
    templates: [],
    thesauris: [],
    relationTypes: [],
    locale: 'en',
  });

  const componentHtml = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
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
