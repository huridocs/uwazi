/* eslint-disable max-statements */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { fromJS as Immutable } from 'immutable';
import { Provider } from 'react-redux';
import { Helmet } from 'react-helmet';
import { I18NUtils, t, Translate } from 'app/I18N';
import JSONUtils from 'shared/JSONUtils';
import RouteHandler from 'app/App/RouteHandler';
import api from 'app/utils/api';
import settingsModel from 'api/settings';
import { FetchResponseError } from 'shared/JSONRequest';
import { RequestParams } from 'app/utils/RequestParams';
import { getPropsFromRoute } from './utils';
import CustomProvider from './App/Provider';
import Root from './App/Root';
import Routes from './AppV2/Routes/Routes';
import settingsApi from '../api/settings/settings';
import createStore from './store';
import translationsApi from '../api/i18n/translations';
import { handleError } from '../api/utils';
import App from './App';

let assets = {};

const renderComponentWithRoot = (
  componentProps,
  data,
  req,
  language,
  actions = [],
  isRedux = false
) => {
  let initialStore = createStore({});

  let initialData = data;

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

  const head = Helmet.rewind();

  let reduxData = {};

  if (isRedux) {
    reduxData = initialData;
  }

  const componentHtml = renderToString(
    <Provider store={initialStore}>
      <CustomProvider initialData={initialData} user={req.user} language={language}>
        {Routes}
      </CustomProvider>
    </Provider>
  );

  return `<!doctype html>\n${renderToString(
    <StaticRouter location={req.url}>
      <Root
        language={language}
        content={componentHtml}
        head={head}
        user={req.user}
        reduxData={reduxData}
        assets={assets}
      />
    </StaticRouter>
  )}`;
};

// function handle404(res) {
//   res.redirect(301, '/404');
// }

function respondError(res, error, req) {
  if (!(error instanceof FetchResponseError)) {
    handleError(error, { req });
  }
  const code = error.status || 500;
  res.status(code);
  const requestId = error.json?.requestId || '';
  if (!req.url.startsWith('/error/500')) {
    res.redirect(`/error/${code}?requestId=${requestId}`);
  } else {
    res.send(`<pre>An unexpected error has occurred. Request id: ${requestId}</pre>`);
  }
}

// function handleRedirect(res, redirectLocation) {
//   res.redirect(302, redirectLocation.pathname + redirectLocation.search);
// }

function onlySystemTranslations(AllTranslations) {
  const rows = AllTranslations.map(translation => {
    const systemTranslation = translation.contexts.find(c => c.id === 'System');
    return { ...translation, contexts: [systemTranslation] };
  });

  return { json: { rows } };
}

function handleRoute(res, renderProps, req) {
  //Testing whith this override since we cant get renderProps right now
  // const routeProps = getPropsFromRoute(renderProps, ['requestState']);
  const routeProps = { requestState: () => {} };

  const renderPage = (actions, initialData, isRedux) => {
    const wholeHtml = renderComponentWithRoot(
      // renderProps,
      {},
      initialData,
      req,
      initialData.locale,
      actions,
      isRedux
    );
    res.status(200).send(wholeHtml);
  };

  RouteHandler.renderedFromServer = true;
  let query;

  // if (renderProps.location && Object.keys(renderProps.location.query).length > 0) {
  //   query = JSONUtils.parseNested(renderProps.location.query);
  // }

  let locale;
  return settingsApi
    .get()
    .then(settings => {
      const { languages } = settings;
      // const urlLanguage =
      // renderProps.params && renderProps.params.lang ? renderProps.params.lang : req.language;
      const urlLanguage = 'en';
      locale = I18NUtils.getLocale(urlLanguage, languages, req.cookies);

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
        tenant: req.get('tenant'),
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

      // const { lang, ...params } = renderProps.params;
      const { lang, ...params } = { lang: 'en' };
      const headers = {
        'Content-Language': locale,
        Cookie: `connect.sid=${req.cookies['connect.sid']}`,
        tenant: req.get('tenant'),
      };

      const requestParams = new RequestParams({ ...query, ...params }, headers);

      return Promise.all([
        routeProps.requestState(requestParams, {
          user: Immutable(user.json),
          templates: Immutable(globalResources.templates),
          thesauris: Immutable(globalResources.thesauris),
          relationTypes: Immutable(globalResources.relationTypes),
          settings: { collection: Immutable(globalResources.settings.collection) },
        }),
        globalResources,
      ]);
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
    .catch(error => {
      if (error.status === 401) {
        return res.redirect(302, '/login');
      }

      if (error.status === 404) {
        return res.redirect(404, '/404');
      }

      return respondError(res, error, req);
    });
}

const allowedRoute = (user = {}, url = '') => {
  const isAdmin = user.role === 'admin';
  const isAuthenticatedUser = ['editor', 'collaborator'].includes(user.role);
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
    (isAuthRoute && (isAdmin || isAuthenticatedUser)) ||
    (!isAdminRoute && !isAuthRoute)
  );
};

function routeMatch(req, res, location, languages) {
  settingsModel.get().then(settings => {
    createStore({
      user: req.user,
      settings: { collection: settings },
    });
    return handleRoute(res, {}, req);
    // try {
    //   match({ routes: Routes, location }, (error, redirectLocation, renderProps) => {
    //     if (redirectLocation) {
    //       return handleRedirect(res, redirectLocation);
    //     }
    //     if (
    //       renderProps &&
    //       renderProps.params.lang &&
    //       !languages.includes(renderProps.params.lang)
    //     ) {
    //       return handle404(res);
    //     }
    //     if (error) {
    //       return respondError(res, error);
    //     }
    //     if (renderProps) {
    //       return handleRoute(res, renderProps, req);
    //     }

    //     return handle404(res);
    //   });
    // } catch (err) {
    //   return handle404(res);
    // }
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
  //REMOVE IN FAVOR OF PROTECTED ROUTES
  if (!allowedRoute(req.user, req.url)) {
    const url = req.user ? '/' : '/login';
    return res.redirect(401, url);
  }

  const location = req.url;

  const { PORT } = process.env;
  api.APIURL(`http://localhost:${PORT || 3000}/api/`);

  Promise.all([settingsApi.get(), getAssets()]).then(([settings]) => {
    const languages = settings.languages.map(l => l.key);
    routeMatch(req, res, location, languages);
  });
}

export default ServerRouter;
