import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import {renderToString} from 'react-dom/server';
import {match, RouterContext} from 'react-router';
import Helmet from 'react-helmet';
import Routes from './Routes';
import t from 'app/I18N/t';
import {Provider} from 'react-redux';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import NoMatch from './App/NoMatch';
import store from './store';
import api from 'app/utils/api';
import {I18NUtils} from 'app/I18N';
import JSONUtils from 'shared/JSONUtils';
import {fromJS as Immutable} from 'immutable';
import {getPropsFromRoute} from './utils';
import translationsApi from '../api/i18n/translations';
import settingsApi from '../api/settings/settings';

import assets from '../../dist/webpack-assets.json';


function renderComponentWithRoot(Component, componentProps, initialData, user, isRedux = false) {
  let componentHtml;

  let initialStore = store({});

  if (isRedux) {
    initialStore = store(initialData);
  }
  // to prevent warnings on some client libs that use window global var
  global.window = {};
  //
  t.resetCachedTranslation();
  try {
    componentHtml = renderToString(
      <Provider store={initialStore}>
        <CustomProvider initialData={initialData} user={user}>
          <Component {...componentProps} />
        </CustomProvider>
      </Provider>
    );
  } catch (e) {
    console.trace(e); // eslint-disable-line
  }

  const head = Helmet.rewind();

  let reduxData = {};
  let data = initialData;

  if (isRedux) {
    reduxData = initialData;
    data = {};
  }

  return '<!doctype html>\n' + renderToString(
    <Root content={componentHtml} initialData={data} head={head} user={user} reduxData={reduxData} assets={assets}/>
  );
}

function handle404(res) {
  const wholeHtml = renderComponentWithRoot(NoMatch);
  res.status(404).send(wholeHtml);
}

function handleError(res, error) {
  res.status(500).send(error.message);
}

function handleRedirect(res, redirectLocation) {
  res.redirect(302, redirectLocation.pathname + redirectLocation.search);
}

function onlySystemTranslations(AllTranslations) {
  const rows = AllTranslations.map((translation) => {
    const systemTranslation = translation.contexts.find((c) => c.id === 'System');
    translation.contexts = [systemTranslation];
    return translation;
  });

  return {json: {rows}};
}

function handleRoute(res, renderProps, req) {
  //const isDeveloping = process.env.NODE_ENV !== 'production';
  const routeProps = getPropsFromRoute(renderProps, ['requestState']);

  function renderPage(initialData, isRedux) {
    try {
      const wholeHtml = renderComponentWithRoot(RouterContext, renderProps, initialData, req.user, isRedux);
      res.status(200).send(wholeHtml);
    } catch (error) {
      console.trace(error); // eslint-disable-line
    }
  }

  if (routeProps.requestState) {
    if (req.cookies) {
      api.cookie('connect.sid=' + req.cookies['connect.sid']);
    }

    RouteHandler.renderedFromServer = true;
    let query;
    if (renderProps.location && Object.keys(renderProps.location.query).length > 0) {
      query = JSONUtils.parseNested(renderProps.location.query);
    }

    let locale;
    return settingsApi.get()
    .then(settings => {
      let languages = settings.languages;
      let path = req.url;
      locale = I18NUtils.getLocale(path, languages, req.cookies);
      api.locale(locale);

      return settings;
    })
    .then(settingsData => {
      if (settingsData.private && !req.user) {
        return Promise.all([
          Promise.resolve({json: {}}),
          Promise.resolve({json: {languages: [], private: settingsData.private}}),
          translationsApi.get().then(onlySystemTranslations),
          Promise.resolve({json: {rows: []}}),
          Promise.resolve({json: {rows: []}})
        ]);
      }

      return Promise.all([
        api.get('user'),
        api.get('settings'),
        api.get('translations'),
        api.get('templates'),
        api.get('thesauris')
      ]);
    })
    .then(([user, settings, translations, templates, thesauris]) => {
      const globalResources = {
        user: user.json,
        settings: {collection: settings.json},
        translations: translations.json.rows,
        templates: templates.json.rows,
        thesauris: thesauris.json.rows
      };

      globalResources.settings.collection.links = globalResources.settings.collection.links || [];

      return Promise.all([routeProps.requestState(renderProps.params, query, {
        templates: Immutable(globalResources.templates),
        thesauris: Immutable(globalResources.thesauris)
      }), globalResources]);
    })
    .catch((error) => {
      if (error.status === 401) {
        res.redirect(302, '/login');
        return Promise.reject(error);
      }

      if (error.status === 404) {
        res.redirect(302, '/404');
        return Promise.reject(error);
      }

      if (error.status === 500) {
        handleError(res, error);
        return Promise.reject(error);
      }
    })
    .then(([initialData, globalResources]) => {
      initialData.user = globalResources.user;
      initialData.settings = globalResources.settings;
      initialData.translations = globalResources.translations;
      initialData.templates = globalResources.templates;
      initialData.thesauris = globalResources.thesauris;
      initialData.locale = locale;
      renderPage(initialData, true);
    })
    .catch((error) => {
      console.trace(error); // eslint-disable-line
    });
  }

  renderPage();
}

let allowedRoute = (user = {}, url) => {
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';
  let authRoutes = [
    '/uploads',
    '/settings/account'
  ];

  let adminRoutes = [
    '/settings/users',
    '/settings/collection',
    '/settings/navlink',
    '/settings/pages',
    '/settings/translations',
    '/settings/filters',
    '/settings/documents',
    '/settings/entities',
    '/settings/dictionaries',
    '/settings/connections'
  ];

  const isAdminRoute = adminRoutes.reduce((found, authRoute) => {
    return found || url.indexOf(authRoute) !== -1;
  }, false);

  const isAuthRoute = authRoutes.reduce((found, authRoute) => {
    return found || url.indexOf(authRoute) !== -1;
  }, false);

  return isAdminRoute && isAdmin ||
    isAuthRoute && (isAdmin || isEditor) ||
    !isAdminRoute && !isAuthRoute;
};

function routeMatch(req, res, location) {
  match({routes: Routes, location}, (error, redirectLocation, renderProps) => {
    if (error) {
      return handleError(error);
    } else if (redirectLocation) {
      return handleRedirect(res, redirectLocation);
    } else if (renderProps) {
      return handleRoute(res, renderProps, req);
    }

    return handle404(res);
  });
}

function ServerRouter(req, res) {
  if (!allowedRoute(req.user, req.url)) {
    const url = req.user ? '/' : '/login';
    res.redirect(302, url);
    return;
  }

  const PORT = process.env.PORT;
  api.APIURL(`http://localhost:${PORT || 3000}/api/`);

  let location = req.url;
  if (location === '/') {
    return settingsApi.get()
    .then((settingsData) => {
      if (settingsData.home_page) {
        location = settingsData.home_page;
      }
    })
    .then(() => {
      routeMatch(req, res, location);
    });
  }

  routeMatch(req, res, location);
}

export default ServerRouter;
