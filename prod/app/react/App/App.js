"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _isomorphicFetch = _interopRequireDefault(require("isomorphic-fetch"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

require("bootstrap/dist/css/bootstrap.css");
require("react-widgets/lib/scss/react-widgets.scss");
require("nprogress/nprogress.css");
var _Notifications = _interopRequireDefault(require("../Notifications"));
var _Cookiepopup = _interopRequireDefault(require("./Cookiepopup"));
var _I18N = require("../I18N");

var _library = require("../UI/Icon/library");
var _UI = require("../UI");

require("./scss/styles.scss");

var _Menu = _interopRequireDefault(require("./Menu"));
var _SiteName = _interopRequireDefault(require("./SiteName"));
var _Confirm = _interopRequireDefault(require("./Confirm"));
var _GoogleAnalytics = _interopRequireDefault(require("./GoogleAnalytics"));
var _Matomo = _interopRequireDefault(require("./Matomo"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

(0, _library.loadIcons)();

class App extends _react.Component {
  constructor(props, context) {
    super(props, context);
    // change fetch to use api and test it properly
    this.fetch = props.fetch || _isomorphicFetch.default;
    this.state = { showmenu: false, confirmOptions: {} };

    this.toggleMenu = this.toggleMenu.bind(this);
  }

  getChildContext() {
    return {
      confirm: this.confirm.bind(this) };

  }

  toggleMenu() {
    this.setState({ showmenu: !this.state.showmenu });
  }

  closeMenu() {
    this.setState({ showmenu: false });
  }

  confirm(options) {
    this.setState({ confirmOptions: options });
  }

  renderTools() {
    return _react.default.Children.map(this.props.children, child => {
      //condition not tested
      if (child.type.renderTools) {
        return child.type.renderTools();
      }

      return undefined;
    });
  }

  render() {
    const { routes, location, params } = this.props;
    let MenuButtonIcon = 'bars';
    let navClass = 'menuNav';

    if (this.state.showmenu) {
      MenuButtonIcon = 'times';
      navClass += ' is-active';
    }

    const customHomePageId = routes.reduce((memo, route) => {
      if (Object.keys(route).includes('customHomePageId')) {
        return route.customHomePageId;
      }
      return memo;
    }, '');

    const pageId = !location.pathname.match('settings') && params.pageId ? params.pageId : '';

    const appClassName = customHomePageId || pageId ? `pageId_${customHomePageId || pageId}` : '';

    return (
      _jsx("div", { id: "app", className: appClassName }, void 0,
      _jsx(_Notifications.default, {}),
      _jsx(_Cookiepopup.default, {}),
      _jsx("div", { className: "content" }, void 0,
      _jsx("nav", {}, void 0,
      _jsx("h1", {}, void 0, _jsx(_SiteName.default, {}))),

      _jsx("header", {}, void 0,
      _jsx("button", { className: "menu-button", onClick: this.toggleMenu }, void 0,
      _jsx(_UI.Icon, { icon: MenuButtonIcon })),

      _jsx("h1", { className: "logotype" }, void 0, _jsx(_SiteName.default, {})),
      this.renderTools(),
      _jsx(_Menu.default, { location: location, onClick: this.toggleMenu, className: navClass })),

      _jsx("div", { className: "app-content container-fluid" }, void 0,
      _react.default.createElement(_Confirm.default, this.state.confirmOptions),
      _jsx(_I18N.TranslateForm, {}),
      this.props.children,
      _jsx(_GoogleAnalytics.default, {}),
      _jsx(_Matomo.default, {})))));




  }}


App.defaultProps = {
  params: {},
  routes: [] };










App.childContextTypes = {
  confirm: _propTypes.default.func,
  locale: _propTypes.default.string };


App.contextTypes = {
  getUser: _propTypes.default.func,
  router: _propTypes.default.object };var _default =


App;exports.default = _default;