"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.ListChartComponent = void 0;var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = _interopRequireDefault(require("immutable"));
var _rison = _interopRequireDefault(require("rison"));
var _queryString = _interopRequireDefault(require("query-string"));

var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _Charts = require("../../Charts");
var _MarkdownLink = _interopRequireDefault(require("./MarkdownLink"));
var _markdownDatasets = _interopRequireDefault(require("../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const ListChartComponent = props => {
  const { excludeZero, property, data, classname, context, colors, thesauris } = props;
  const sliceColors = colors.split(',');

  let output = _jsx(_Loader.default, {});

  if (data) {
    const formattedData = _Charts.arrayUtils.sortValues(
    _Charts.arrayUtils.formatDataForChart(data, property, thesauris, {
      excludeZero: Boolean(excludeZero),
      context }));


    let query = { filters: {} };

    if (props.baseUrl) {
      const { q } = _queryString.default.parse(props.baseUrl.substring(props.baseUrl.indexOf('?')));
      query = _rison.default.decode(q);
      query.filters = query.filters || {};
    }

    output =
    _jsx("ul", {}, void 0,
    formattedData.map((item, index) => {
      const Content =
      _jsx("div", {}, void 0,
      _jsx("div", { className: "list-bullet", style: { backgroundColor: sliceColors[index % sliceColors.length] } }, void 0,
      _jsx("span", {}, void 0, item.results)),

      _jsx("span", { className: "list-label" }, void 0, item.label));



      query.filters[property] = { values: [item.id] };

      return (
        _jsx("li", {}, item.id,
        props.baseUrl && _jsx(_MarkdownLink.default, { url: `/library/?q=${_rison.default.encode(query)}`, classname: "list-link" }, void 0, Content),
        !props.baseUrl && Content));


    }));


  }

  return _jsx("div", { className: `ListChart ${classname}` }, void 0, output);
};exports.ListChartComponent = ListChartComponent;

ListChartComponent.defaultProps = {
  context: 'System',
  excludeZero: false,
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  baseUrl: null };
















const mapStateToProps = (state, props) => ({
  data: _markdownDatasets.default.getAggregations(state, props),
  thesauris: state.thesauris });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(ListChartComponent);exports.default = _default;