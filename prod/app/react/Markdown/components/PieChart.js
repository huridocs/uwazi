"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.PieChartComponent = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));

var _recharts = require("recharts");

var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _Charts = require("../../Charts");
var _PieChartLabel = _interopRequireDefault(require("./PieChartLabel"));
var _markdownDatasets = _interopRequireDefault(require("../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const PieChartComponent = props => {
  const {
    showLabel,
    outerRadius,
    innerRadius,
    property,
    data,
    classname,
    context,
    colors,
    thesauris,
    maxCategories } =
  props;

  let output = _jsx(_Loader.default, {});

  if (data) {
    const aggregateOthers = props.aggregateOthers === 'true';
    const formattedData = _Charts.arrayUtils.sortValues(
    _Charts.arrayUtils.formatDataForChart(data, property, thesauris, { context, excludeZero: true, maxCategories, aggregateOthers }));

    const sliceColors = colors.split(',');
    const shouldShowLabel = showLabel === 'true';
    output =
    _jsx(_recharts.ResponsiveContainer, { width: "100%", height: 222 }, void 0,
    _jsx(_recharts.PieChart, { width: 222, height: 222 }, void 0,
    _jsx(_recharts.Pie, {
      data: formattedData,
      dataKey: "results",
      nameKey: "label",
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      fill: "#8884d8",
      labelLine: shouldShowLabel,
      label: shouldShowLabel ? _jsx(_PieChartLabel.default, { data: formattedData }) : undefined }, void 0,


    formattedData.map((entry, index) => _jsx(_recharts.Cell, { fill: sliceColors[index % sliceColors.length] }, index))),


    !shouldShowLabel && _jsx(_recharts.Tooltip, {})));



  }

  return _jsx("div", { className: `PieChart ${classname}` }, void 0, output);
};exports.PieChartComponent = PieChartComponent;

PieChartComponent.defaultProps = {
  context: 'System',
  innerRadius: '0',
  outerRadius: '105',
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  showLabel: 'false',
  aggregateOthers: 'false',
  maxCategories: '0' };
















const mapStateToProps = (state, props) => ({
  data: _markdownDatasets.default.getAggregations(state, props),
  thesauris: state.thesauris });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(PieChartComponent);exports.default = _default;