"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactRouter = require("react-router");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _UI = require("../../UI");
var _Auth = require("../../Auth");
var _ = require("./..");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class I18NMenu extends _react.Component {
  static reload(url) {
    window.location.href = url;
  }

  render() {
    const { languages, locale, location, i18nmode, toggleInlineEdit } = this.props;

    let path = location.pathname;
    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    path = path.replace(regexp, '/');

    return (
      _jsx("ul", { className: "menuNav-I18NMenu" }, void 0,
      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("button", {
        className: `menuNav-btn btn btn-default${i18nmode ? ' inlineEdit active' : ''}`,
        type: "button",
        onClick: toggleInlineEdit }, void 0,

      _jsx(_UI.Icon, { icon: "language", size: "lg" }))),


      languages.count() > 1 && languages.map(lang => {
        const key = lang.get('key');
        const url = `/${key}${path}${path.match('document') ? '' : location.search}`;
        return (
          _jsx("li", { className: `menuNav-item${locale === key ? ' is-active' : ''}` }, key,
          _jsx("a", { className: "menuNav-btn btn btn-default", href: url }, void 0, key)));


      })));


  }}


I18NMenu.defaultProps = {
  locale: null };










function mapStateToProps(state) {
  return {
    languages: state.settings.collection.get('languages'),
    i18nmode: state.inlineEdit.get('inlineEdit'),
    locale: state.locale };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ toggleInlineEdit: _.actions.toggleInlineEdit }, dispatch);
}var _default =

(0, _reactRouter.withRouter)((0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(I18NMenu));exports.default = _default;