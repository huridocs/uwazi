"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _store = require("../store");
var _react = _interopRequireDefault(require("react"));
var _translate = _interopRequireWildcard(require("../../shared/translate"));
var _ = require(".");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const testingEnvironment = process.env.NODE_ENV === 'test';
const t = (contextId, key, _text, returnComponent = true) => {
  if (returnComponent && !testingEnvironment) {
    return _jsx(_.Translate, { context: contextId }, void 0, key);
  }
  const text = _text || key;

  if (!t.translation) {
    const state = _store.store.getState();
    const translations = state.translations.toJS();
    t.translation = (0, _translate.getLocaleTranslation)(translations, state.locale);
  }

  const context = (0, _translate.getContext)(t.translation, contextId);

  return (0, _translate.default)(context, key, text);
};

t.resetCachedTranslation = () => {
  t.translation = null;
};var _default =


t;exports.default = _default;