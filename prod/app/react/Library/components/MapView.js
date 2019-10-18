"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.MapView = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _Map = require("../../Map");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");
var _libraryActions = require("../actions/libraryActions");
var _SearchBar = _interopRequireDefault(require("./SearchBar"));
var _Layout = require("../../Layout");
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const markerInfo = info => _jsx("div", { className: "marker-info" }, void 0, _jsx(_UI.Icon, { className: "tag-icon", icon: "tag" }), info);

class MapView extends _react.Component {
  static renderInfo(marker) {
    return (
      _jsx("div", { className: "popup-container" }, void 0,
      _jsx("div", { className: "template-label" }, void 0,
      _jsx(_Layout.TemplateLabel, { template: marker.properties.entity.template })),

      _jsx("div", { className: "entity-data" }, void 0,
      _jsx("div", {}, void 0,
      _jsx("span", { className: "popup-name" }, void 0, marker.properties.entity.title),
      _jsx("span", { className: "popup-metadata-property" }, void 0, "(", (0, _I18N.t)(marker.properties.entity.template, marker.label), ")")),

      marker.properties.inherited && markerInfo(_jsx(_Layout.EntityTitle, { context: marker.properties.context, entity: marker.properties.inheritedEntity })),
      marker.properties.info && !marker.properties.inherited && markerInfo(marker.properties.info))));



  }

  constructor(props) {
    super(props);
    this.clickOnMarker = this.clickOnMarker.bind(this);
    this.clickOnCluster = this.clickOnCluster.bind(this);
  }

  clickOnMarker(marker) {
    this.props.getAndSelectDocument(marker.properties.entity.sharedId);
  }

  clickOnCluster(cluster) {
    this.props.unselectAllDocuments();
    this.props.selectDocuments(cluster.map(m => m.properties.entity));
  }

  render() {
    const { storeKey, markers } = this.props;
    return (
      _jsx("div", { className: "library-map main-wrapper", style: { width: '100%', height: '100%' } }, void 0,
      _jsx("div", { className: "search-list" }, void 0, _jsx(_SearchBar.default, { storeKey: storeKey })),
      _jsx("div", { className: "documents-counter" }, void 0,
      _jsx("span", {}, void 0, _jsx("b", {}, void 0, markers.get('totalRows')), " ", (0, _I18N.t)('System', 'documents'))),

      _jsx(_Map.Markers, { entities: markers.get('rows') }, void 0,
      (processedMarkers) =>
      _react.default.createElement(_Map.Map, {
        ref: ref => {this.map = ref;},
        markers: processedMarkers,
        zoom: 1,
        clickOnMarker: this.clickOnMarker,
        clickOnCluster: this.clickOnCluster,
        renderPopupInfo: MapView.renderInfo,
        cluster: true }))));





  }}exports.MapView = MapView;










function mapStateToProps(state, props) {
  return {
    markers: state[props.storeKey].markers };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ getAndSelectDocument: _libraryActions.getAndSelectDocument, selectDocuments: _libraryActions.selectDocuments, unselectAllDocuments: _libraryActions.unselectAllDocuments }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, null, { withRef: true })(MapView);exports.default = _default;