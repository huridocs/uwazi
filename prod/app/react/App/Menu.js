"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.Menu = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _Multireducer = require("../Multireducer");
var _Auth = require("../Auth");
var _I18N = require("../I18N");
var _libraryActions = require("../Library/actions/libraryActions");
var _actions = require("../SemanticSearch/actions/actions");
var _UI = require("../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Menu extends _react.Component {
  libraryUrl() {
    const { searchTerm } = this.props.location.query;
    const params = (0, _libraryActions.processFilters)(this.props.librarySearch, this.props.libraryFilters.toJS());
    params.searchTerm = searchTerm;
    return `/library/${(0, _libraryActions.encodeSearch)(params)}`;
  }

  uploadsUrl() {
    const params = (0, _libraryActions.processFilters)(this.props.uploadsSearch, this.props.uploadsFilters.toJS());
    return `/uploads/${(0, _libraryActions.encodeSearch)(params)}`;
  }

  renderSemanticSearchButton() {
    if (!this.props.semanticSearch) {
      return false;
    }
    return (
      _jsx(_Auth.NeedAuthorization, { roles: ['admin'] }, void 0,
      _jsx("li", { className: "menuNav-item semantic-search" }, void 0,
      _jsx("button", { type: "button", onClick: this.props.showSemanticSearch, className: "menuNav-btn btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "flask" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Semantic search'))))));




  }

  render() {
    const { links } = this.props;
    const user = this.props.user.toJS();

    const navLinks = links.map(link => {
      const url = link.get('url') || '/';

      if (url.startsWith('http')) {
        return (
          _jsx("li", { className: "menuNav-item" }, link.get('_id'),
          _jsx("a", { href: url, className: "btn menuNav-btn", target: "_blank" }, void 0, (0, _I18N.t)('Menu', link.get('title')))));


      }
      return (
        _jsx("li", { className: "menuNav-item" }, link.get('_id'),
        _jsx(_I18N.I18NLink, { to: url, className: "btn menuNav-btn" }, void 0, (0, _I18N.t)('Menu', link.get('title')))));


    });

    return (
      _jsx("ul", { onClick: this.props.onClick, className: this.props.className }, void 0,
      _jsx("li", { className: "menuItems" }, void 0,
      _jsx("ul", { className: "menuNav-list" }, void 0, navLinks)),

      _jsx("li", { className: "menuActions" }, void 0,
      _jsx("ul", { className: "menuNav-list" }, void 0,
      this.renderSemanticSearchButton(),
      _jsx("li", { className: "menuNav-item" }, void 0,
      _jsx(_I18N.I18NLink, { to: this.libraryUrl(), className: "menuNav-btn btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "th" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Public documents')))),


      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("li", { className: "menuNav-item" }, void 0,
      _jsx(_I18N.I18NLink, { to: this.uploadsUrl(), className: "menuNav-btn btn btn-default" }, void 0,
      _jsx("span", {}, void 0,
      _jsx(_UI.Icon, { icon: "cloud-upload-alt" })),

      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Private documents'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("li", { className: "menuNav-item" }, void 0,
      _jsx(_I18N.I18NLink, { to: "/settings/account", className: "menuNav-btn btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "cog" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Account settings'))))),



      (() => {
        if (!user._id) {
          return (
            _jsx("li", { className: "menuNav-item" }, void 0,
            _jsx(_I18N.I18NLink, { to: "/login", className: "menuNav-btn btn btn-default" }, void 0,
            _jsx(_UI.Icon, { icon: "power-off" }),
            _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Sign in')))));



        }

        return null;
      })()),

      _jsx(_I18N.I18NMenu, {}))));



  }}exports.Menu = Menu;


Menu.defaultProps = {
  semanticSearch: false,
  showSemanticSearch: () => {} };
















function mapStateToProps({ user, settings, library, uploads }) {
  const features = settings.collection.toJS().features || {};
  return {
    user,
    librarySearch: library.search,
    libraryFilters: library.filters,
    uploadsSearch: uploads.search,
    uploadsFilters: uploads.filters,
    uploadsSelectedSorting: uploads.selectedSorting,
    links: settings.collection.get('links'),
    semanticSearch: features.semanticSearch };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    showSemanticSearch: _actions.showSemanticSearch },
  (0, _Multireducer.wrapDispatch)(dispatch, 'library'));
}var _default =


(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Menu);exports.default = _default;