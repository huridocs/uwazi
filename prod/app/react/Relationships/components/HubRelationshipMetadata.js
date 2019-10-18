"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _immutable = require("immutable");

var _I18N = require("../../I18N");
var _formater = _interopRequireDefault(require("../../Metadata/helpers/formater"));
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const conformQuote = (text) =>
_jsx("div", { className: "relationship-quote" }, void 0,
_jsx("span", { className: "quoteIconStart" }, void 0,
_jsx(_UI.Icon, { icon: "quote-left" })),

text,
_jsx("span", { className: "quoteIconEnd" }, void 0,
_jsx(_UI.Icon, { icon: "quote-right" })));




const conformDl = ({ label, name, value }) =>
_jsx("dl", { className: "item-property-default" }, name,
_jsx("dt", {}, void 0, label),
_jsx("dd", {}, void 0, Array.isArray(value) ? value.map(v => v.value).join(', ') : value));









const extendedMetadata = (relationship, text, relationTypes, thesauris) => {
  const formattedMetadata = _formater.default.prepareMetadata(relationship.toJS(), relationTypes, thesauris).metadata;
  return (
    _jsx("div", { className: "relationship-metadata" }, void 0,
    _jsx("div", { className: "item-metadata" }, void 0,
    formattedMetadata.map(conformDl),
    text && conformDl({
      label: (0, _I18N.t)('System', 'Text'),
      name: 'text',
      value: conformQuote(relationship.getIn(['range', 'text'])) }))));




};

const justText = (text) =>
_jsx("div", { className: "relationship-metadata" }, void 0,
conformQuote(text));



const HubRelationshipMetadata = props => {
  const { relationship, relationTypes, thesauris } = props;
  const text = relationship.getIn(['range', 'text']);
  const metadata = relationship.get('metadata');

  if (metadata && metadata.size) {
    return extendedMetadata(relationship, text, relationTypes, thesauris);
  }

  if (text) {
    return justText(text);
  }

  return null;
};

HubRelationshipMetadata.defaultProps = {
  relationship: (0, _immutable.Map)({}) };








function mapStateToProps({ relationTypes, thesauris }) {
  return { relationTypes, thesauris };
}var _default =

(0, _reactRedux.connect)(mapStateToProps)(HubRelationshipMetadata);exports.default = _default;