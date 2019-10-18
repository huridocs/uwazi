"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _immutable = require("immutable");
var _reactRedux = require("react-redux");
var _reactRouter = require("react-router");
var _server = require("react-dom/server");
var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _react = _interopRequireDefault(require("react"));

var _I18N = require("./I18N");
var _JSONUtils = _interopRequireDefault(require("../shared/JSONUtils"));
var _RouteHandler = _interopRequireDefault(require("./App/RouteHandler"));
var _api = _interopRequireDefault(require("./utils/api"));
var _settings = _interopRequireDefault(require("../api/settings"));
var _fs = _interopRequireDefault(require("fs"));

var _RequestParams = require("./utils/RequestParams");
var _utils = require("./utils");
var _Provider = _interopRequireDefault(require("./App/Provider"));
var _Root = _interopRequireDefault(require("./App/Root"));
var _Routes = _interopRequireDefault(require("./Routes"));
var _settings2 = _interopRequireDefault(require("../api/settings/settings"));
var _store = _interopRequireDefault(require("./store"));
var _translations = _interopRequireDefault(require("../api/i18n/translations"));
var _handleError = _interopRequireDefault(require("../api/utils/handleError"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

let assets = {};

function renderComponentWithRoot(actions = [], componentProps, data, user, isRedux = false, language) {
  let initialStore = (0, _store.default)({});

  let initialData = data;
  const Component = _reactRouter.RouterContext;
  if (isRedux) {
    initialStore = (0, _store.default)(initialData);
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
  _I18N.t.resetCachedTranslation();
  _I18N.Translate.resetCachedTranslation();
  const componentHtml = (0, _server.renderToString)(
  _jsx(_reactRedux.Provider, { store: initialStore }, void 0,
  _jsx(_Provider.default, { initialData: initialData, user: user, language: language }, void 0,
  _react.default.createElement(Component, componentProps))));




  const head = _reactHelmet.default.rewind();

  let reduxData = {};

  if (isRedux) {
    reduxData = initialData;
  }

  return `<!doctype html>\n${(0, _server.renderToString)(
  _jsx(_Root.default, { language: language, content: componentHtml, head: head, user: user, reduxData: reduxData, assets: assets }))
  }`;
}

function handle404(res) {
  res.redirect(301, '/404');
}

function respondError(res, error) {
  (0, _handleError.default)(error);
  res.status(500).send(error.message);
}

function handleRedirect(res, redirectLocation) {
  res.redirect(302, redirectLocation.pathname + redirectLocation.search);
}

function onlySystemTranslations(AllTranslations) {
  const rows = AllTranslations.map(translation => {
    const systemTranslation = translation.contexts.find(c => c.id === 'System');
    return _objectSpread({}, translation, { contexts: [systemTranslation] });
  });

  return { json: { rows } };
}

function handleRoute(res, renderProps, req) {
  const routeProps = (0, _utils.getPropsFromRoute)(renderProps, ['requestState']);

  function renderPage(actions, initialData, isRedux) {
    const wholeHtml = renderComponentWithRoot(actions, renderProps, initialData, req.user, isRedux, initialData.locale);
    res.status(200).send(wholeHtml);
  }

  _RouteHandler.default.renderedFromServer = true;
  let query;
  if (renderProps.location && Object.keys(renderProps.location.query).length > 0) {
    query = _JSONUtils.default.parseNested(renderProps.location.query);
  }

  let locale;
  return _settings2.default.get().
  then(settings => {
    const { languages } = settings;
    const urlLanguage = renderProps.params && renderProps.params.lang ? renderProps.params.lang : req.language;
    locale = _I18N.I18NUtils.getLocale(urlLanguage, languages, req.cookies);
    // api.locale(locale);

    return settings;
  }).
  then(settingsData => {
    if (settingsData.private && !req.user) {
      return Promise.all([
      Promise.resolve({ json: {} }),
      Promise.resolve({ json: { languages: [], private: settingsData.private } }),
      _translations.default.get().then(onlySystemTranslations),
      Promise.resolve({ json: { rows: [] } }),
      Promise.resolve({ json: { rows: [] } }),
      Promise.resolve({ json: { rows: [] } })]);

    }

    const headers = {
      'Content-Language': locale,
      Cookie: `connect.sid=${req.cookies['connect.sid']}` };


    const requestParams = new _RequestParams.RequestParams({}, headers);
    return Promise.all([
    _api.default.get('user', requestParams),
    _api.default.get('settings', requestParams),
    _api.default.get('translations', requestParams),
    _api.default.get('templates', requestParams),
    _api.default.get('thesauris', requestParams),
    _api.default.get('relationTypes', requestParams)]);

  }).
  then(([user, settings, translations, templates, thesauris, relationTypes]) => {
    const globalResources = {
      user: user.json,
      settings: { collection: settings.json },
      translations: translations.json.rows,
      templates: templates.json.rows,
      thesauris: thesauris.json.rows,
      relationTypes: relationTypes.json.rows };


    globalResources.settings.collection.links = globalResources.settings.collection.links || [];

    const _renderProps$params = renderProps.params,{ lang } = _renderProps$params,params = _objectWithoutProperties(_renderProps$params, ["lang"]);
    const headers = {
      'Content-Language': locale,
      Cookie: `connect.sid=${req.cookies['connect.sid']}` };


    const requestParams = new _RequestParams.RequestParams(_objectSpread({}, query, {}, params), headers);

    return Promise.all([routeProps.requestState(
    requestParams,
    {
      templates: (0, _immutable.fromJS)(globalResources.templates),
      thesauris: (0, _immutable.fromJS)(globalResources.thesauris),
      relationTypes: (0, _immutable.fromJS)(globalResources.relationTypes) }),


    globalResources]);
  }).
  catch(error => {
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
  }).
  then(([initialData, globalResources]) => {
    renderPage(initialData, {
      locale,
      user: globalResources.user,
      settings: globalResources.settings,
      translations: globalResources.translations,
      templates: globalResources.templates,
      thesauris: globalResources.thesauris,
      relationTypes: globalResources.relationTypes },
    true);
  }).
  catch(e => (0, _handleError.default)(e, { req }));
}

const allowedRoute = (user = {}, url) => {
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';
  const authRoutes = [
  '/uploads',
  '/settings/account'];


  const adminRoutes = [
  '/settings/users',
  '/settings/collection',
  '/settings/navlink',
  '/settings/pages',
  '/settings/translations',
  '/settings/filters',
  '/settings/templates',
  '/settings/dictionaries',
  '/settings/connections'];


  const isAdminRoute = adminRoutes.reduce((found, authRoute) => found || url.indexOf(authRoute) !== -1, false);

  const isAuthRoute = authRoutes.reduce((found, authRoute) => found || url.indexOf(authRoute) !== -1, false);

  return isAdminRoute && isAdmin ||
  isAuthRoute && (isAdmin || isEditor) ||
  !isAdminRoute && !isAuthRoute;
};

function routeMatch(req, res, location, languages) {
  _settings.default.get().
  then(settings => {
    (0, _store.default)({
      user: req.user,
      settings: { collection: settings } });


    (0, _reactRouter.match)({ routes: _Routes.default, location }, (error, redirectLocation, renderProps) => {
      if (redirectLocation) {
        return handleRedirect(res, redirectLocation);
      }
      if (renderProps && renderProps.params.lang && !languages.includes(renderProps.params.lang)) {
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
  });
}

function getAssets() {
  if (process.env.HOT) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    _fs.default.readFile(`${__dirname}/../../dist/webpack-assets.json`, (err, data) => {
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
  _api.default.APIURL(`http://localhost:${PORT || 3000}/api/`);

  const location = req.url;

  Promise.all([_settings2.default.get(), getAssets()]).
  then(([settings]) => {
    const languages = settings.languages.map(l => l.key);
    routeMatch(req, res, location, languages);
  });
}var _default =

ServerRouter;exports.default = _default;