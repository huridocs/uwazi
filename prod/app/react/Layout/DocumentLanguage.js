"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.DocumentLanguage = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");

var _languagesList = _interopRequireDefault(require("../../shared/languagesList"));
var _t = _interopRequireDefault(require("../I18N/t"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class DocumentLanguage extends _react.Component {
  render() {
    const { doc } = this.props;

    if (!doc.get('file')) {
      return null;
    }

    if (doc.get('file')) {
      const fileLanguage = doc.getIn(['file', 'language']);
      if (fileLanguage && fileLanguage !== 'other') {
        if (this.props.locale === (0, _languagesList.default)(fileLanguage, 'ISO639_1')) {
          return null;
        }

        return (
          _jsx("span", { className: "item-type__documentLanguage" }, void 0,
          _jsx("span", {}, void 0, (0, _languagesList.default)(fileLanguage, 'ISO639_1') || fileLanguage)));


      }

      return _jsx("span", { className: "item-type__documentLanguage" }, void 0, _jsx("span", {}, void 0, (0, _t.default)('System', 'Other')));
    }
  }}exports.DocumentLanguage = DocumentLanguage;







const mapStateToProps = ({ locale }) => ({ locale });exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps)(DocumentLanguage);exports.default = _default;