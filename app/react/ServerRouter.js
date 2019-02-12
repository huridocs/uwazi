import { fromJS as Immutable } from 'immutable';
import { Provider } from 'react-redux';
import { match, RouterContext } from 'react-router';
import { renderToString } from 'react-dom/server';
import Helmet from 'react-helmet';
import React from 'react';

import { I18NUtils, t, Translate } from 'app/I18N';
import JSONUtils from 'shared/JSONUtils';
import RouteHandler from 'app/App/RouteHandler';
import api from 'app/utils/api';
import fs from 'fs';

import { getPropsFromRoute } from './utils';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import Routes from './Routes';
import settingsApi from '../api/settings/settings';
import createStore from './store';
import translationsApi from '../api/i18n/translations';
import handleError from '../api/utils/handleError';


let assets = {};

function renderComponentWithRoot(Component, componentProps, initialData, user, isRedux = false, language) {
  let initialStore = createStore({});

  if (isRedux) {
    initialStore = createStore(initialData);
  }
  // to prevent warnings on some client libs that use window global var
  global.window = {};
  //
  t.resetCachedTranslation();
  Translate.resetCachedTranslation();
  const componentHtml = renderToString(
    <Provider store={initialStore}>
      <CustomProvider initialData={initialData} user={user} language={language}>
        <Component {...componentProps} />
      </CustomProvider>
    </Provider>
  );

  const head = Helmet.rewind();

  let reduxData = {};

  if (isRedux) {
    reduxData = initialData;
  }

  return `<!doctype html>\n${renderToString(
    <Root language={language} content={componentHtml} head={head} user={user} reduxData={reduxData} assets={assets}/>
  )}`;
}

function handle404(res) {
  res.redirect(301, '/404');
}

function respondError(res, error) {
  handleError(error);
  res.status(500).send(error.message);
}

function handleRedirect(res, redirectLocation) {
  res.redirect(302, redirectLocation.pathname + redirectLocation.search);
}

function onlySystemTranslations(AllTranslations) {
  const rows = AllTranslations.map((translation) => {
    const systemTranslation = translation.contexts.find(c => c.id === 'System');
    return { ...translation, contexts: [systemTranslation] };
  });

  return { json: { rows } };
}

function handleRoute(res, renderProps, req) {
  const routeProps = getPropsFromRoute(renderProps, ['requestState']);

  function renderPage(initialData, isRedux) {
    const wholeHtml = renderComponentWithRoot(RouterContext, renderProps, initialData, req.user, isRedux, req.language);
    res.status(200).send(wholeHtml);
  }

  if (routeProps.requestState) {
    if (req.cookies) {
      api.cookie(`connect.sid=${req.cookies['connect.sid']}`);
    }

    RouteHandler.renderedFromServer = true;
    let query;
    if (renderProps.location && Object.keys(renderProps.location.query).length > 0) {
      query = JSONUtils.parseNested(renderProps.location.query);
    }

    let locale;
    return settingsApi.get()
    .then((settings) => {
      const { languages } = settings;
      const urlLanguage = renderProps.params && renderProps.params.lang ? renderProps.params.lang : req.language;
      locale = I18NUtils.getLocale(urlLanguage, languages, req.cookies);
      api.locale(locale);

      return settings;
    })
    .then((settingsData) => {
      if (settingsData.private && !req.user) {
        return Promise.all([
          Promise.resolve({ json: {} }),
          Promise.resolve({ json: { languages: [], private: settingsData.private } }),
          translationsApi.get().then(onlySystemTranslations),
          Promise.resolve({ json: { rows: [] } }),
          Promise.resolve({ json: { rows: [] } }),
          Promise.resolve({ json: { rows: [] } })
        ]);
      }

      return Promise.all([
        api.get('user'),
        api.get('settings'),
        api.get('translations'),
        api.get('templates'),
        api.get('thesauris'),
        api.get('relationTypes')
      ]);
    })
    .then(([user, settings, translations, templates, thesauris, relationTypes]) => {
      const globalResources = {
        user: user.json,
        settings: { collection: settings.json },
        translations: translations.json.rows,
        templates: templates.json.rows,
        thesauris: thesauris.json.rows,
        relationTypes: relationTypes.json.rows
      };

      globalResources.settings.collection.links = globalResources.settings.collection.links || [];

      return Promise.all([routeProps.requestState(renderProps.params, query, {
        templates: Immutable(globalResources.templates),
        thesauris: Immutable(globalResources.thesauris),
        relationTypes: Immutable(globalResources.relationTypes)
      }), globalResources]);
    })
    .catch((error) => {
      if (error.status === 401) {
        res.redirect(302, '/login');
        return Promise.reject(error);
      }

      if (error.status === 404) {
        res.redirect(404, '/404');
        return Promise.reject(error);
      }

      if (error.status === 500) {
        respondError(res, error);
        return Promise.reject(error);
      }

      return Promise.reject(error);
    })
    .then(([initialData, globalResources]) => {
      renderPage({
        ...initialData,
        locale,
        user: globalResources.user,
        settings: globalResources.settings,
        translations: globalResources.translations,
        templates: globalResources.templates,
        thesauris: globalResources.thesauris,
        relationTypes: globalResources.relationTypes,
      }, true);
    })
    .catch(e => handleError(e, { req }));
  }

  return renderPage();
}

const allowedRoute = (user = {}, url) => {
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';
  const authRoutes = [
    '/uploads',
    '/settings/account'
  ];

  const adminRoutes = [
    '/settings/users',
    '/settings/collection',
    '/settings/navlink',
    '/settings/pages',
    '/settings/translations',
    '/settings/filters',
    '/settings/templates',
    '/settings/dictionaries',
    '/settings/connections'
  ];

  const isAdminRoute = adminRoutes.reduce((found, authRoute) => found || url.indexOf(authRoute) !== -1, false);

  const isAuthRoute = authRoutes.reduce((found, authRoute) => found || url.indexOf(authRoute) !== -1, false);

  return isAdminRoute && isAdmin ||
    isAuthRoute && (isAdmin || isEditor) ||
    !isAdminRoute && !isAuthRoute;
};

function routeMatch(req, res, location, languages) {
  match({ routes: Routes, location }, (error, redirectLocation, renderProps) => {
    if (renderProps && renderProps.params.lang && !languages.includes(renderProps.params.lang)) {
      return handle404(res);
    }
    if (error) {
      return respondError(res, error);
    } else if (redirectLocation) {
      return handleRedirect(res, redirectLocation);
    } else if (renderProps) {
      return handleRoute(res, renderProps, req);
    }

    return handle404(res);
  });
}

function getAssets() {
  if (process.env.HOT) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/../../dist/webpack-assets.json`, (err, data) => {
      if (err) {
        reject(new Error(`${err}\nwebpack-assets.json do not exists or is malformed !,
                          you probably need to build webpack with the production configuration`));
      }
      try {
        assets = JSON.parse(data);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

function ServerRouter(req, res) {
  if (!allowedRoute(req.user, req.url)) {
    const url = req.user ? '/' : '/login';
    return res.redirect(401, url);
  }

  const { PORT } = process.env;
  api.APIURL(`http://localhost:${PORT || 3000}/api/`);

  const location = req.url;

  Promise.all([settingsApi.get(), getAssets()])
  .then(([settings]) => {
    const languages = settings.languages.map(l => l.key);
    routeMatch(req, res, location, languages);
  });
}

export default ServerRouter;
