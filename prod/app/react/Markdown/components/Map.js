"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapDispatchToProps = exports.mapStateToProps = exports.MapComponent = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));

var _Map = require("../../Map");
var _Layout = require("../../Layout");
var _libraryActions = require("../../Library/actions/libraryActions");
var _Multireducer = require("../../Multireducer");

var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _markdownDatasets = _interopRequireDefault(require("../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const renderInfo = (marker) =>
_jsx("div", {}, void 0,
_jsx(_Layout.TemplateLabel, { template: marker.properties.entity.template }), "\xA0 ",
marker.properties.entity.title);



const MapComponent = props => {
  const { data, classname, scrollZoom, showControls } = props;
  const clickOnMarker = marker => props.getAndSelectDocument(marker.properties.entity.sharedId);
  const clickOnCluster = cluster => {
    props.unselectAllDocuments();
    props.selectDocuments(cluster.map(m => m.properties.entity));
  };

  return (
    _jsx("div", { className: `Map ${classname}` }, void 0,
    data ?
    _jsx(_Map.Markers, { entities: data }, void 0,
    (markers) =>
    _jsx(_Map.Map, {
      markers: markers,
      zoom: 1,
      clickOnMarker: clickOnMarker,
      clickOnCluster: clickOnCluster,
      renderPopupInfo: renderInfo,
      cluster: true,
      scrollZoom: scrollZoom === 'true',
      showControls: showControls === 'true' })) :



    _jsx(_Loader.default, {})));


};exports.MapComponent = MapComponent;

MapComponent.defaultProps = {
  classname: '',
  data: null,
  scrollZoom: null,
  showControls: null };












const mapStateToProps = (state, props) => ({
  data: _markdownDatasets.default.getRows(state, props) });exports.mapStateToProps = mapStateToProps;


const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)(
{ getAndSelectDocument: _libraryActions.getAndSelectDocument, selectDocuments: _libraryActions.selectDocuments, unselectAllDocuments: _libraryActions.unselectAllDocuments },
(0, _Multireducer.wrapDispatch)(dispatch, 'library'));exports.mapDispatchToProps = mapDispatchToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, null)(MapComponent);exports.default = _default;