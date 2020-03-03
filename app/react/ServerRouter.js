/** @format */

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
import settingsModel from 'api/settings';
import fs from 'fs';

import { RequestParams } from 'app/utils/RequestParams';
import { getPropsFromRoute } from './utils';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import Routes from './Routes';
import settingsApi from '../api/settings/settings';
import createStore from './store';
import translationsApi from '../api/i18n/translations';
import handleError from '../api/utils/handleError';

let assets = {};

function renderComponentWithRoot(
  actions = [],
  componentProps,
  data,
  user,
  isRedux = false,
  language
) {
  let initialStore = createStore({});

  let initialData = data;
  const Component = RouterContext;
  if (isRedux) {
    initialStore = createStore(initialData);
    if (actions.forEach) {
      actions.forEach(action => {
        initialStore.dispatch(action);
      });
    }
    initialData = initialStore.getState();
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
    <Root
      language={language}
      content={componentHtml}
      head={head}
      user={user}
      reduxData={reduxData}
      assets={assets}
    />
  )}`;
}

function handle404(res) {
  res.redirect(301, '/404');
}

function respondError(res, error) {
  handleError(error);
  res.status(error.status || 500).send(error.message);
}

function handleRedirect(res, redirectLocation) {
  res.redirect(302, redirectLocation.pathname + redirectLocation.search);
}

function onlySystemTranslations(AllTranslations) {
  const rows = AllTranslations.map(translation => {
    const systemTranslation = translation.contexts.find(c => c.id === 'System');
    return { ...translation, contexts: [systemTranslation] };
  });

  return { json: { rows } };
}

function handleRoute(res, renderProps, req) {
  const routeProps = getPropsFromRoute(renderProps, ['requestState']);

  function renderPage(actions, initialData, isRedux) {
    const wholeHtml = renderComponentWithRoot(
      actions,
      renderProps,
      initialData,
      req.user,
      isRedux,
      initialData.locale
    );
    res.status(200).send(wholeHtml);
  }

  RouteHandler.renderedFromServer = true;
  let query;
  if (renderProps.location && Object.keys(renderProps.location.query).length > 0) {
    query = JSONUtils.parseNested(renderProps.location.query);
  }

  let locale;
  return settingsApi
    .get()
    .then(settings => {
      const { languages } = settings;
      const urlLanguage =
        renderProps.params && renderProps.params.lang ? renderProps.params.lang : req.language;
      locale = I18NUtils.getLocale(urlLanguage, languages, req.cookies);
      // api.locale(locale);

      return settings;
    })
    .then(settingsData => {
      if (settingsData.private && !req.user) {
        return Promise.all([
          Promise.resolve({ json: {} }),
          Promise.resolve({ json: { languages: [], private: settingsData.private } }),
          translationsApi.get().then(onlySystemTranslations),
          Promise.resolve({ json: { rows: [] } }),
          Promise.resolve({ json: { rows: [] } }),
          Promise.resolve({ json: { rows: [] } }),
        ]);
      }

      const headers = {
        'Content-Language': locale,
        Cookie: `connect.sid=${req.cookies['connect.sid']}`,
      };

      const requestParams = new RequestParams({}, headers);
      return Promise.all([
        api.get('user', requestParams),
        api.get('settings', requestParams),
        api.get('translations', requestParams),
        api.get('templates', requestParams),
        api.get('thesauris', requestParams),
        api.get('relationTypes', requestParams),
      ]);
    })
    .then(([user, settings, translations, templates, thesauris, relationTypes]) => {
      const globalResources = {
        user: user.json,
        settings: { collection: settings.json },
        translations: translations.json.rows,
        templates: templates.json.rows,
        thesauris: thesauris.json.rows,
        relationTypes: relationTypes.json.rows,
      };

      globalResources.settings.collection.links = globalResources.settings.collection.links || [];

      const { lang, ...params } = renderProps.params;
      const headers = {
        'Content-Language': locale,
        Cookie: `connect.sid=${req.cookies['connect.sid']}`,
      };

      const requestParams = new RequestParams({ ...query, ...params }, headers);

      return Promise.all([
        routeProps.requestState(requestParams, {
          templates: Immutable(globalResources.templates),
          thesauris: Immutable(globalResources.thesauris),
          relationTypes: Immutable(globalResources.relationTypes),
          settings: { collection: Immutable(globalResources.settings.collection) },
        }),
        globalResources,
      ]);
    })
    .catch(error => {
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
      renderPage(
        initialData,
        {
          locale,
          user: globalResources.user,
          settings: globalResources.settings,
          translations: globalResources.translations,
          templates: globalResources.templates,
          thesauris: globalResources.thesauris,
          relationTypes: globalResources.relationTypes,
        },
        true
      );
    })
    .catch(e => handleError(e, { req }));
}

const allowedRoute = (user = {}, url) => {
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';
  const authRoutes = ['/uploads', '/settings/account'];

  const adminRoutes = [
    '/settings/users',
    '/settings/collection',
    '/settings/navlink',
    '/settings/pages',
    '/settings/translations',
    '/settings/filters',
    '/settings/templates',
    '/settings/dictionaries',
    '/settings/connections',
  ];

  const isAdminRoute = adminRoutes.reduce(
    (found, authRoute) => found || url.indexOf(authRoute) !== -1,
    false
  );

  const isAuthRoute = authRoutes.reduce(
    (found, authRoute) => found || url.indexOf(authRoute) !== -1,
    false
  );

  return (
    (isAdminRoute && isAdmin) ||
    (isAuthRoute && (isAdmin || isEditor)) ||
    (!isAdminRoute && !isAuthRoute)
  );
};

function routeMatch(req, res, location, languages) {
  settingsModel.get().then(settings => {
    createStore({
      user: req.user,
      settings: { collection: settings },
    });
    try {
      match({ routes: Routes, location }, (error, redirectLocation, renderProps) => {
        if (redirectLocation) {
          return handleRedirect(res, redirectLocation);
        }
        if (
          renderProps &&
          renderProps.params.lang &&
          !languages.includes(renderProps.params.lang)
        ) {
          return handle404(res);
        }
        if (error) {
          return respondError(res, error);
        }
        if (renderProps) {
          return handleRoute(res, renderProps, req);
        }

        return handle404(res);
      });
    } catch (err) {
      return handle404(res);
    }
  });
}

function getAssets() {
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

  Promise.all([settingsApi.get(), getAssets()]).then(([settings]) => {
    const languages = settings.languages.map(l => l.key);
    routeMatch(req, res, location, languages);
  });
}

export default ServerRouter;
