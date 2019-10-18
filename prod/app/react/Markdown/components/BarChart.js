"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.BarChartComponent = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));

var _recharts = require("recharts");









var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _Charts = require("../../Charts");
var _markdownDatasets = _interopRequireDefault(require("../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

//eslint-disable-next-line
const X = ({ layout }) => {
  if (layout === 'vertical') {
    return _jsx(_recharts.XAxis, { type: "number", dataKey: "results" });
  }
  return _jsx(_recharts.XAxis, { dataKey: "label", label: "" });
};

//eslint-disable-next-line
const Y = ({ layout }) => {
  if (layout === 'vertical') {
    return _jsx(_recharts.YAxis, { width: 200, type: "category", dataKey: "label" });
  }
  return _jsx(_recharts.YAxis, {});
};

const BarChartComponent = props => {
  const { excludeZero, maxCategories, layout, property, data, classname, context, thesauris } = props;
  let output = _jsx(_Loader.default, {});

  if (data) {
    const aggregateOthers = props.aggregateOthers === 'true';
    const formattedData = _Charts.arrayUtils.sortValues(
    _Charts.arrayUtils.formatDataForChart(data, property, thesauris, {
      excludeZero: Boolean(excludeZero),
      context,
      maxCategories,
      aggregateOthers }));



    output =
    _jsx(_recharts.ResponsiveContainer, { height: 320 }, void 0,
    _jsx(_recharts.BarChart, {
      height: 300,
      data: formattedData,
      layout: layout }, void 0,

    X({ layout }),
    Y({ layout }),

    _jsx(_recharts.CartesianGrid, { strokeDasharray: "2 4" }),
    _jsx(_recharts.Tooltip, {}),
    _jsx(_recharts.Bar, { dataKey: "results", fill: "rgb(30, 28, 138)", stackId: "unique" })));



  }

  return _jsx("div", { className: `BarChart ${classname}` }, void 0, output);
};exports.BarChartComponent = BarChartComponent;

BarChartComponent.defaultProps = {
  context: 'System',
  excludeZero: false,
  layout: 'horizontal',
  maxCategories: '0',
  aggregateOthers: 'false',
  classname: '',
  data: null };

















const mapStateToProps = (state, props) => ({
  data: _markdownDatasets.default.getAggregations(state, props),
  thesauris: state.thesauris });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(BarChartComponent);exports.default = _default;