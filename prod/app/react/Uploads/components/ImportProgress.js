"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.ImportProgress = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _redux = require("redux");
var _uploadsActions = require("../actions/uploadsActions");
var _immutable = _interopRequireDefault(require("immutable"));
var _StackTrace = _interopRequireDefault(require("../../components/Elements/StackTrace"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ImportProgress extends _react.Component {
  render() {
    const { close, importState: { importStart, importProgress, importError, importEnd } } = this.props;
    if (!importStart && !importProgress) {
      return false;
    }
    if (importEnd) {
      return (
        _jsx("div", { className: "alert alert-info" }, void 0,
        _jsx(_UI.Icon, { icon: "check", size: "2x" }),
        _jsx("div", { className: "force-ltr" }, void 0,
        _jsx(_I18N.Translate, {}, void 0, "Import completed:"), "\xA0", importProgress, " ", _jsx(_I18N.Translate, {}, void 0, "created"),
        _jsx("br", {}),
        _jsx(_I18N.Translate, {}, void 0, "Indexing entities may take a few minutes")),

        _jsx(_UI.Icon, { style: { cursor: 'pointer' }, icon: "times", onClick: close })));


    }

    if (importError.get('message')) {
      return (
        _jsx("div", {}, void 0,
        _jsx("div", { className: "alert alert-danger" }, void 0,
        _jsx(_UI.Icon, { icon: "exclamation-triangle", size: "2x" }),
        _jsx("div", { className: "force-ltr" }, void 0,
        _jsx(_I18N.Translate, {}, void 0, "The import process threw an error:")),

        _jsx(_UI.Icon, { style: { cursor: 'pointer' }, icon: "times", onClick: close })),

        _jsx(_StackTrace.default, { message: importError.get('message') })));



    }

    return (
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "cog", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Importing data in progress"), ": ", importProgress)));



  }}exports.ImportProgress = ImportProgress;












const mapStateToProps = state => ({
  importState: state.importEntities });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ close: _uploadsActions.closeImportProgress }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ImportProgress);exports.default = _default;