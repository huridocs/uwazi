"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRouter = require("react-router");

var _App = _interopRequireDefault(require("./App/App"));
var _NoMatch = _interopRequireDefault(require("./App/NoMatch"));

var _Login = _interopRequireDefault(require("./Users/Login"));
var _ResetPassword = _interopRequireDefault(require("./Users/ResetPassword"));
var _UnlockAccount = _interopRequireDefault(require("./Users/UnlockAccount"));

var _Settings = require("./Settings");














var _Activitylog = _interopRequireDefault(require("./Activitylog/Activitylog"));
var _Pages = _interopRequireDefault(require("./Pages/Pages"));
var _NewPage = _interopRequireDefault(require("./Pages/NewPage"));
var _EditPage = _interopRequireDefault(require("./Pages/EditPage"));
var _PageView = _interopRequireDefault(require("./Pages/PageView"));

var _Users = require("./Users");

var _ViewDocument = _interopRequireDefault(require("./Viewer/ViewDocument"));
var _EntityView = _interopRequireDefault(require("./Entities/EntityView"));
var _UploadsRoute = _interopRequireDefault(require("./Uploads/UploadsRoute"));

var _EditTemplate = _interopRequireDefault(require("./Templates/EditTemplate"));
var _NewTemplate = _interopRequireDefault(require("./Templates/NewTemplate"));

var _EditThesauri = _interopRequireDefault(require("./Thesauris/EditThesauri"));
var _NewThesauri = _interopRequireDefault(require("./Thesauris/NewThesauri"));

var _EditRelationType = _interopRequireDefault(require("./RelationTypes/EditRelationType"));
var _NewRelationType = _interopRequireDefault(require("./RelationTypes/NewRelationType"));

var _EditTranslations = _interopRequireDefault(require("./I18N/EditTranslations"));

var _Library = _interopRequireDefault(require("./Library/Library"));
var _LibraryMap = _interopRequireDefault(require("./Library/LibraryMap"));

var _SemanticSearchResultsView = _interopRequireDefault(require("./SemanticSearch/SemanticSearchResultsView"));

var _GoogleAnalytics = require("./App/GoogleAnalytics");
var _blankState = _interopRequireDefault(require("./Library/helpers/blankState"));
var _store = require("./store");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

function onEnter() {
  (0, _GoogleAnalytics.trackPage)();
}

function needsAuth(nxtState, replace) {
  if (!_store.store.getState().user.get('_id')) {
    replace('/login');
  }
}

function enterOnLibrary(nxtState, replace) {
  const state = _store.store.getState();
  if ((0, _blankState.default)() && !state.user.get('_id')) {
    return replace('/login');
  }
  (0, _GoogleAnalytics.trackPage)();
}

function getIndexRoute(nextState, callBack) {
  const state = _store.store.getState();
  const homePageSetting = state.settings.collection.get('home_page');
  const customHomePage = homePageSetting ? homePageSetting.split('/') : [];
  const isPageRoute = customHomePage.includes('page');

  let pageId = '';
  let component = _Library.default;
  if (isPageRoute) {
    pageId = customHomePage[customHomePage.indexOf('page') + 1];
    component = props => _react.default.createElement(_PageView.default, _extends({}, props, { params: { sharedId: pageId } }));
    component.requestState = requestParams => _PageView.default.requestState(requestParams.set({ sharedId: pageId }));
  }

  const indexRoute = {
    component,
    onEnter: (nxtState, replace) => {
      if (!isPageRoute) {
        replace(customHomePage.join('/'));
      }
      if (!homePageSetting) {
        enterOnLibrary(nxtState, replace);
      }
    },
    customHomePageId: pageId };

  callBack(null, indexRoute);
}

const routes =
_jsx(_reactRouter.Route, { getIndexRoute: getIndexRoute }, void 0,
_jsx(_reactRouter.Route, { path: "settings", component: _Settings.Settings, onEnter: needsAuth }, void 0,
_jsx(_reactRouter.Route, { path: "account", component: _Settings.AccountSettings }),
_jsx(_reactRouter.Route, { path: "collection", component: _Settings.CollectionSettings }),
_jsx(_reactRouter.Route, { path: "navlinks", component: _Settings.NavlinksSettings }),
_jsx(_reactRouter.Route, { path: "users" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Users.Users }),
_jsx(_reactRouter.Route, { path: "new", component: _Users.NewUser }),
_jsx(_reactRouter.Route, { path: "edit/:userId", component: _Users.EditUser })),

_jsx(_reactRouter.Route, { path: "pages" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Pages.default }),
_jsx(_reactRouter.Route, { path: "new", component: _NewPage.default }),
_jsx(_reactRouter.Route, { path: "edit/:sharedId", component: _EditPage.default })),

_jsx(_reactRouter.Route, { path: "templates" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Settings.EntityTypesList }),
_jsx(_reactRouter.Route, { path: "new", component: _NewTemplate.default }),
_jsx(_reactRouter.Route, { path: "edit/:templateId", component: _EditTemplate.default })),

_jsx(_reactRouter.Route, { path: "connections" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Settings.RelationTypesList }),
_jsx(_reactRouter.Route, { path: "new", component: _NewRelationType.default }),
_jsx(_reactRouter.Route, { path: "edit/:_id", component: _EditRelationType.default })),

_jsx(_reactRouter.Route, { path: "dictionaries" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Settings.ThesaurisList }),
_jsx(_reactRouter.Route, { path: "new", component: _NewThesauri.default }),
_jsx(_reactRouter.Route, { path: "edit/:_id", component: _EditThesauri.default })),

_jsx(_reactRouter.Route, { path: "languages", component: _Settings.Languages }),
_jsx(_reactRouter.Route, { path: "translations" }, void 0,
_jsx(_reactRouter.IndexRoute, { component: _Settings.TranslationsList }),
_jsx(_reactRouter.Route, { path: "edit/:context", component: _EditTranslations.default })),

_jsx(_reactRouter.Route, { path: "filters", component: _Settings.FiltersForm }),
_jsx(_reactRouter.Route, { path: "customisation", component: _Settings.Customisation }),
_jsx(_reactRouter.Route, { path: "custom-uploads", component: _Settings.CustomUploads }),
_jsx(_reactRouter.Route, { path: "activitylog", component: _Activitylog.default, onEnter: needsAuth })),

_jsx(_reactRouter.Route, { path: "library", component: _Library.default, onEnter: enterOnLibrary }),
_jsx(_reactRouter.Route, { path: "library/map", component: _LibraryMap.default, onEnter: onEnter }),
_jsx(_reactRouter.Route, { path: "uploads", component: _UploadsRoute.default }),
_jsx(_reactRouter.Route, { path: "login", component: _Login.default }),
_jsx(_reactRouter.Route, { path: "setpassword/:key", component: _ResetPassword.default }),
_jsx(_reactRouter.Route, { path: "unlockaccount/:username/:code", component: _UnlockAccount.default }),
_jsx(_reactRouter.Route, { path: "document/:sharedId*", component: _ViewDocument.default, onEnter: onEnter }),
_jsx(_reactRouter.Route, { path: "entity/:sharedId", component: _EntityView.default, onEnter: onEnter }),
_jsx(_reactRouter.Route, { path: "page/:sharedId", component: _PageView.default, onEnter: onEnter }),
_jsx(_reactRouter.Route, { path: "semanticsearch/:searchId", component: _SemanticSearchResultsView.default, onEnter: onEnter }),
_jsx(_reactRouter.Route, { path: "404", component: _NoMatch.default }));var _default =




_jsx(_reactRouter.Route, { path: "/", component: _App.default }, void 0,
routes,
_jsx(_reactRouter.Route, { path: ":lang" }, void 0,
routes,
_jsx(_reactRouter.Route, { path: "*", component: _NoMatch.default })),

_jsx(_reactRouter.Route, { path: "*", component: _NoMatch.default }));exports.default = _default;