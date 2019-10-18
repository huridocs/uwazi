"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _reactReduxForm = require("react-redux-form");

var _TemplatesAPI = _interopRequireDefault(require("./TemplatesAPI"));
var _ThesaurisAPI = _interopRequireDefault(require("../Thesauris/ThesaurisAPI"));
var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypes/RelationTypesAPI"));
var _TemplateCreator = _interopRequireDefault(require("./components/TemplateCreator"));
var _BasicReducer = require("../BasicReducer");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _templateCommonProperties = _interopRequireDefault(require("./utils/templateCommonProperties"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const prepareTemplate = template => {
  const commonPropertiesExists = template.commonProperties && template.commonProperties.length;

  return _objectSpread({},
  template, {
    properties: template.properties.map(p => _objectSpread({}, p, { localID: (0, _uniqueID.default)() })),
    commonProperties: commonPropertiesExists ? template.commonProperties : _templateCommonProperties.default.get() });

};

class EditTemplate extends _RouteHandler.default {
  static async requestState(requestParams) {
    const { templateId } = requestParams.data;
    const [templates, thesauris, relationTypes] = await Promise.all([
    _TemplatesAPI.default.get(requestParams.onlyHeaders()),
    _ThesaurisAPI.default.get(requestParams.onlyHeaders()),
    _RelationTypesAPI.default.get(requestParams.onlyHeaders())]);


    const template = Object.assign({}, templates.find(tmpl => tmpl._id === templateId));

    return [
    _reactReduxForm.actions.load('template.data', prepareTemplate(template)),
    _BasicReducer.actions.set('thesauris', thesauris),
    _BasicReducer.actions.set('templates', templates),
    _BasicReducer.actions.set('relationTypes', relationTypes)];

  }

  componentDidMount() {
    this.context.store.dispatch(_reactReduxForm.actions.reset('template.data'));
  }

  render() {
    return _jsx(_TemplateCreator.default, {});
  }}exports.default = EditTemplate;