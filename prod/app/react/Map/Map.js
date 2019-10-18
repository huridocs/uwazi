"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactMapGl = _interopRequireWildcard(require("react-map-gl"));
var _immutable = _interopRequireDefault(require("immutable"));

var _UI = require("../UI");

var _utils = require("../utils");
var _supercluster = _interopRequireDefault(require("supercluster"));
var _style2 = _interopRequireDefault(require("./style.json"));
var _helper = require("./helper");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

if (_utils.isClient) {
  require('mapbox-gl').setRTLTextPlugin('/public/mapbox-gl-rtl-text.js.min'); //eslint-disable-line
}

const getStateDefaults = ({ latitude, longitude, width, height, zoom }) => ({
  viewport: { latitude: latitude || 46, longitude: longitude || 6, width: width || 250, height: height || 200, zoom },
  selectedMarker: null,
  settings: { scrollZoom: true, touchZoom: true },
  showControls: false });


class Map extends _react.Component {
  constructor(props) {
    super(props);
    this.state = getStateDefaults(props);
    this.state.settings.scrollZoom = props.scrollZoom;
    this.state.settings.touchZoom = props.scrollZoom;
    this.state.showControls = props.showControls;

    this.mapStyle = _immutable.default.fromJS(_style2.default);
    this.supercluster = (0, _supercluster.default)({
      radius: _style2.default.sources.markers.clusterRadius,
      maxZoom: _style2.default.sources.markers.clusterMaxZoom });

    this.updateMapStyle(props);
    this.bindActions();
    this.assignDefaults();
  }

  componentDidMount() {
    const { markers } = this.props;
    this.setSize();
    const map = this.map.getMap();
    map.on('load', () => this.centerOnMarkers(markers));
    map.on('moveend', e => {
      if (e.autoCentered) {
        this.setViweport(map);
      }
    });
    this.eventListener = window.addEventListener('resize', this.setSize);
  }

  componentWillReceiveProps(props) {
    const { viewport } = this.state;
    const { markers } = props;
    const latitude = props.latitude || viewport.latitude;
    const longitude = props.longitude || viewport.longitude;
    const newViewport = Object.assign(viewport, { latitude, longitude, markers });

    if (!_immutable.default.fromJS(this.props.markers).equals(_immutable.default.fromJS(markers))) {
      this.autoCenter(markers);
      this.updateMapStyle(props);
    }
    this.setState({ viewport: newViewport });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  onClick(e) {
    const { markers, onClick } = this.props;
    const unclusteredPoints = e.features.filter(f => f.layer.id === 'unclustered-point');
    const cluster = e.features.find(f => f.layer.id === 'clusters');

    switch (true) {
      case unclusteredPoints.length === 1:
        this.clickOnMarker(markers[unclusteredPoints[0].properties.index]);
        break;
      case unclusteredPoints.length > 1:
        this.clickOnCluster(unclusteredPoints.map(marker => markers[marker.properties.index]));
        break;
      default:
        break;}


    if (cluster) {this.processClusterOnClick(cluster);}

    onClick(e);
  }

  onHover(e) {
    const { markers, cluster } = this.props;
    const { selectedMarker } = this.state;

    const feature = e.features.find(f => f.layer.id === 'unclustered-point');
    if (feature) {
      this.hoverOnMarker(markers[feature.properties.index]);
    }
    if (!feature && selectedMarker && cluster) {
      this.setState({ selectedMarker: null });
    }
  }

  setSize() {
    const { viewport } = this.state;
    const { width, height } = this.props;
    viewport.width = width || this.container.offsetWidth;
    viewport.height = height || this.container.offsetHeight;
    this.setState({ viewport });
  }

  setViweport(map) {
    const { viewport } = this.state;
    const newViewport = Object.assign(viewport, {
      latitude: map.getCenter().lat,
      longitude: map.getCenter().lng,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing() });

    this.setState({ viewport: newViewport });
  }

  bindActions() {
    this.zoom = this.zoom.bind(this);
    this.setSize = this.setSize.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onHover = this.onHover.bind(this);
  }

  assignDefaults() {
    this._onViewportChange = viewport => {this.setState({ viewport });};
    this._onViewStateChange = viewport => {this.setState({ viewport });};

    this.zoomIn = () => this.zoom(+1);
    this.zoomOut = () => this.zoom(-1);
  }

  processClusterOnClick(cluster) {
    const map = this.map.getMap();
    const currentData = this.mapStyle.getIn(['sources', 'markers', 'data', 'features']).toJS();
    this.supercluster.load(currentData);
    const markersOnCluster = this.supercluster.getLeaves(cluster.properties.cluster_id, Math.floor(map.getZoom()), Infinity);
    this.clickOnCluster(markersOnCluster);
  }

  autoCenter(markers) {
    const { autoCenter } = this.props;
    if (autoCenter) {
      this.centerOnMarkers(markers);
    }
  }

  centerOnMarkers(markers) {
    if (!this.map || !markers.length) {
      return;
    }
    const map = this.map.getMap();
    const boundaries = (0, _helper.getMarkersBoudingBox)(markers);
    map.stop().fitBounds(boundaries, { padding: { top: 70, left: 20, right: 20, bottom: 20 }, maxZoom: 5, duration: 0 }, { autoCentered: true });
  }

  zoom(amount) {
    const { viewport } = this.state;
    if (!this.map) {return;}
    const map = this.map.getMap();
    this._onViewStateChange(Object.assign({}, viewport, { zoom: map.getZoom() + amount }, _helper.TRANSITION_PROPS, { transitionDuration: 500 }));
  }

  updateMapStyle({ cluster, markers }) {
    if (!cluster) {
      return;
    }

    const markersData = (0, _helper.markersToStyleFormat)(markers);
    const currentData = this.mapStyle.getIn(['sources', 'markers', 'data', 'features']);
    if (!currentData.equals(_immutable.default.fromJS(markersData))) {
      const style = this.mapStyle.setIn(['sources', 'markers', 'data', 'features'], _immutable.default.fromJS(markersData));
      this.mapStyle = style;
      this.supercluster.load(markersData);
    }
  }

  clickOnMarker(marker) {
    const { clickOnMarker } = this.props;
    clickOnMarker(marker);
  }

  clickOnCluster(cluster) {
    const { clickOnCluster } = this.props;
    clickOnCluster(cluster);
  }

  hoverOnMarker(marker) {
    const { selectedMarker } = this.state;
    const { hoverOnMarker } = this.props;

    if (selectedMarker !== marker) {
      this.setState({ selectedMarker: marker });
    }

    hoverOnMarker(marker);
  }

  renderMarker(marker, onClick, onMouseEnter, onMouseLeave) {
    const { renderMarker } = this.props;
    if (renderMarker) {
      return renderMarker(marker, onClick);
    }
    return (
      _jsx(_UI.Icon, {
        style: { position: 'relative', top: '-25px', right: '15px', color: '#d9534e' },
        icon: "map-marker",
        size: "2x",
        fixedWidth: true,
        onClick: onClick,
        onMouseOver: onMouseEnter,
        onMouseLeave: onMouseLeave }));


  }

  renderPopup() {
    const { selectedMarker } = this.state;
    const { renderPopupInfo } = this.props;
    if (selectedMarker && (renderPopupInfo || selectedMarker && selectedMarker.properties && selectedMarker.properties.info)) {
      const { longitude, latitude } = selectedMarker;
      return (
        _jsx(_reactMapGl.Popup, { tipSize: 6, anchor: "bottom", longitude: longitude, latitude: latitude, offsetTop: -20, closeButton: false }, void 0,
        _jsx("div", {}, void 0,
        renderPopupInfo ? renderPopupInfo(selectedMarker) : selectedMarker.properties.info)));



    }
    return false;
  }

  renderMarkers() {
    const { markers, cluster } = this.props;
    if (cluster) {
      return false;
    }

    return markers.map((marker, index) => {
      const onClick = this.clickOnMarker.bind(this, marker);
      const onMouseEnter = this.hoverOnMarker.bind(this, marker);
      const onMouseLeave = this.hoverOnMarker.bind(this, null);
      return (
        _react.default.createElement(_reactMapGl.Marker, _extends({}, marker, { key: index, offsetLeft: 0, offsetTop: 0 }),
        this.renderMarker(marker, onClick, onMouseEnter, onMouseLeave)));


    });
  }

  renderControls() {
    const { showControls } = this.state;
    if (showControls) {
      return (
        _jsx("div", { className: "mapbox-navigation" }, void 0,
        _jsx(_reactMapGl.NavigationControl, { onViewportChange: this._onViewportChange })));


    }

    return false;
  }

  render() {
    const { viewport, settings } = this.state;

    return (
      _react.default.createElement("div", { className: "map-container", ref: container => {this.container = container;}, style: { width: '100%', height: '100%' } },
      _react.default.createElement(_reactMapGl.default, _extends({
        ref: ref => {this.map = ref;} },
      viewport,
      settings, {
        dragRotate: true,
        mapStyle: this.mapStyle,
        onViewportChange: this._onViewportChange,
        onViewStateChange: this._onViewStateChange,
        onClick: this.onClick,
        onHover: this.onHover }),

      this.renderMarkers(),
      this.renderPopup(),
      this.renderControls(),
      _jsx("span", { className: "mapbox-help" }, void 0,
      _jsx(_UI.Icon, { icon: "question-circle" }),
      _jsx("span", { className: "mapbox-tooltip" }, void 0, "Hold shift to rotate the map")))));




  }}exports.default = Map;


Map.defaultProps = {
  markers: [],
  latitude: null,
  longitude: null,
  zoom: 4,
  width: null,
  height: null,
  onClick: () => {},
  clickOnMarker: () => {},
  hoverOnMarker: () => {},
  clickOnCluster: () => {},
  renderPopupInfo: null,
  renderMarker: null,
  cluster: false,
  autoCenter: true,
  scrollZoom: true,
  showControls: false };