"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.RechartsBar = void 0;var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _recharts = require("recharts");

var _arrayUtils = _interopRequireDefault(require("../utils/arrayUtils"));

var _colorScheme = _interopRequireDefault(require("../utils/colorScheme"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ExtendedTooltip extends _react.default.Component {
  render() {
    if (this.props.active) {
      return (
        _jsx("div", { style: { backgroundColor: '#fff', border: '1px solid #ccc' } }, void 0,
        _jsx("div", { style: { backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px' } }, void 0,
        this.props.chartLabel),

        _jsx("div", { style: { padding: '5px' } }, void 0,
        this.props.payload[0].payload.name, ":\xA0\xA0", _jsx("b", { style: { color: '#600' } }, void 0, this.props.payload[0].value))));



    }
    return null;
  }}








const ColoredBar = props => {
  const { index } = props;
  return _react.default.createElement(_recharts.Rectangle, _extends({}, props, { stroke: "none", fill: _colorScheme.default[index % _colorScheme.default.length] }));
};










class RechartsBar extends _react.Component {
  componentWillMount() {
    this.mountData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.mountData(nextProps);
    }
  }

  mountData(props) {
    let fullData = [];

    if (props.data) {
      fullData = props.data.map(item => ({ name: item.label, value: item.results, xAxisName: '' }));
    }
    this.setState({ fullData });
  }

  render() {
    return (
      _jsx(_recharts.ResponsiveContainer, { height: 320 }, void 0,
      _jsx(_recharts.BarChart, {
        height: 300,
        data: this.state.fullData,
        margin: { top: 0, right: 30, left: 0, bottom: 0 } }, void 0,

      _jsx(_recharts.XAxis, { dataKey: "xAxisName", label: this.props.chartLabel }),
      _jsx(_recharts.YAxis, {}),
      _jsx(_recharts.CartesianGrid, { strokeDasharray: "2 4" }),
      _jsx(_recharts.Tooltip, { content: _jsx(ExtendedTooltip, { parentData: this.state.fullData, chartLabel: this.props.chartLabel }) }),
      _jsx(_recharts.Bar, { dataKey: "value", fill: "#D24040", shape: _jsx(ColoredBar, {}) }),
      _jsx(_recharts.Legend, { payload: _arrayUtils.default.formatPayload(this.state.fullData) }))));



  }}exports.RechartsBar = RechartsBar;var _default =







(0, _reactRedux.connect)()(RechartsBar);exports.default = _default;