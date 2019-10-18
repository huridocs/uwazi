"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ShowMetadata = void 0;var _immutable = _interopRequireDefault(require("immutable"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Icon = require("../../Layout/Icon");
var _Layout = require("../../Layout");
var _timelineFixedData = require("../../Timeline/utils/timelineFixedData");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _TimelineViewer = _interopRequireDefault(require("../../Timeline/components/TimelineViewer"));

var _FormatMetadata = _interopRequireDefault(require("../containers/FormatMetadata"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ShowMetadata extends _react.Component {
  render() {
    const { entity, showTitle, showType, relationships } = this.props;
    let header = '';
    if (showTitle || showType) {
      let title = '';
      if (showTitle) {
        title =
        _jsx("div", {}, void 0,
        _jsx(_Icon.Icon, { className: "item-icon item-icon-center", data: entity.icon }),
        _jsx("h1", { className: "item-name" }, void 0,
        entity.title,
        _jsx(_Layout.DocumentLanguage, { doc: _immutable.default.fromJS(entity) })));



      }
      const type = showType ? _jsx(_Layout.TemplateLabel, { template: entity.template }) : '';
      header = _jsx("div", { className: "item-info" }, void 0, title, type);
    }

    return (
      _jsx("div", { className: "view" }, void 0,
      header,

      _jsx(_ShowIf.default, { if: entity.template === _timelineFixedData.caseTemplate || entity.template === _timelineFixedData.matterTemplate }, void 0,
      _jsx("dl", { className: "metadata-timeline-viewer" }, void 0,
      _jsx("dd", {}, void 0, _jsx(_TimelineViewer.default, { entity: entity })))),


      _jsx(_FormatMetadata.default, { entity: entity, relationships: relationships })));


  }}exports.ShowMetadata = ShowMetadata;










const mapStateToProps = ({ templates }) => ({ templates });var _default =

(0, _reactRedux.connect)(mapStateToProps)(ShowMetadata);exports.default = _default;