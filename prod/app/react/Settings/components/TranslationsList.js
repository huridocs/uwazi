"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.TranslationsList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var _advancedSort = require("../../utils/advancedSort");
var _UI = require("../../UI");

var _notificationsActions = require("../../Notifications/actions/notificationsActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TranslationsList extends _react.Component {
  render() {
    const { settings, translations } = this.props;
    const defaultLanguage = settings.get('languages').find(lang => lang.get('default')).get('key');
    const defaultTranslation = translations.find(translation => translation.get('locale') === defaultLanguage);
    const contexts = (0, _advancedSort.advancedSort)(defaultTranslation.get('contexts').toJS().map(c => {
      c.sort = c.type + c.label;
      return c;
    }), { property: 'sort' });
    return (
      _jsx("div", { className: "TranslationsList panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Translations')),
      _jsx("ul", { className: "list-group relation-types" }, void 0,
      contexts.map((context, index) =>
      _jsx("li", { className: "list-group-item" }, index,
      _jsx("div", {}, void 0,
      _jsx("span", { className: "item-type item-type-empty" }, void 0,
      _jsx("span", { className: "item-type__name" }, void 0, context.type)),

      _jsx(_I18N.I18NLink, { to: `/settings/translations/edit/${encodeURIComponent(context.id)}` }, void 0, context.label)),

      _jsx("div", { className: "list-group-item-actions" }, void 0,
      _jsx(_I18N.I18NLink, { to: `/settings/translations/edit/${encodeURIComponent(context.id)}`, className: "btn btn-default btn-xs" }, void 0,
      _jsx(_UI.Icon, { icon: "language" }), " ", (0, _I18N.t)('System', 'Translate'))))))));







  }}exports.TranslationsList = TranslationsList;








function mapStateToProps(state) {
  return {
    translations: state.translations,
    settings: state.settings.collection };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ notify: _notificationsActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(TranslationsList);exports.default = _default;