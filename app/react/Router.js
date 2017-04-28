import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import ReactDOM from 'react-dom';
import {renderToString} from 'react-dom/server';
import {browserHistory} from 'react-router';
import {Router, match, RouterContext} from 'react-router';
import Helmet from 'react-helmet';
import Routes from './Routes';
import {Provider} from 'react-redux';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import NoMatch from './App/NoMatch';
import {isClient, getPropsFromRoute} from './utils';
import store from './store';
import api from 'app/utils/api';
import {I18NUtils} from 'app/I18N';
import JSONUtils from 'shared/JSONUtils';
import Perf from 'react-addons-perf';
import {fromJS as Immutable} from 'immutable';

if (isClient) {
  window.perf = Perf;
  ReactDOM.render(
    <Provider store={store()}>
      <CustomProvider>
        <Router history={browserHistory}>{Routes}</Router>
      </CustomProvider>
    </Provider>,
    document.getElementById('root')
  );
}

function renderComponentWithRoot(Component, componentProps, initialData, user, isRedux = false) {
  let componentHtml;

  let initialStore = store({});

  if (isRedux) {
    initialStore = store(initialData);
  }

  // to prevent warnings on some client libs that use window global var
  global.window = {};
  //
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
    <Root content={componentHtml} initialData={data} head={head} user={user} reduxData={reduxData}/>
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
    return api.get('settings').then((response) => {
      let languages = response.json.languages;
      let path = req.url;
      locale = I18NUtils.getLocale(path, languages, req.cookies);
      api.locale(locale);
    })
    .then(() => {
      return Promise.all([
        api.get('user'),
        api.get('settings'),
        api.get('translations'),
        api.get('templates'),
        api.get('thesauris')
      ])
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
    });
  }

  renderPage();
}

function ServerRouter(req, res) {
  let authRoutes = [
    '/uploads',
    '/settings'
  ];
  if (!req.user && authRoutes.reduce((found, authRoute) => {
    return found || req.url.indexOf(authRoute) !== -1;
  }, false)) {
    res.redirect(302, '/login');
  }

  api.get('settings')
  .then((response) => {
    let location = req.url;
    if (location === '/' && response.json.home_page) {
      location = response.json.home_page;
    }

    match({routes: Routes, location}, (error, redirectLocation, renderProps) => {
      if (error) {
        handleError(error);
      } else if (redirectLocation) {
        handleRedirect(res, redirectLocation);
      } else if (renderProps) {
        handleRoute(res, renderProps, req);
      } else {
        handle404(res);
      }
    });
  });
}

export default ServerRouter;
