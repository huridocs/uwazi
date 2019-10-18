"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.countryKey = exports.countriesTemplate = void 0;var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Charts = require("../../../Charts");
var _Loader = _interopRequireDefault(require("../../../components/Elements/Loader"));
var _I18N = require("../../../I18N");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const countriesTemplate = '58b2f3a35d59f31e1345b480';exports.countriesTemplate = countriesTemplate;
const countryKey = 'pa_s';exports.countryKey = countryKey;

class CejilChart extends _react.Component {
  componentDidMount() {
    this.props.getData.call(this).
    then(([groupedResults, setA, setB]) => {
      this.setState({ groupedResults, setA, setB });
    });
  }

  render() {
    let output = _jsx(_Loader.default, {});

    if (this.state && this.state.groupedResults) {
      const { aggregations } = this.state.groupedResults;
      const countriesData = this.props.thesauris.find(thesaury => thesaury.get('_id') === countriesTemplate);

      let data = _Charts.arrayUtils.sortValues(aggregations.all[countryKey].buckets.
      filter(country => country.filtered.doc_count).
      map(_country => {
        const country = _country;
        const foundCountry = countriesData.get('values').find(v => v.get('id') === country.key);
        country.label = foundCountry ? foundCountry.get('label') : (0, _I18N.t)('System', 'No Value', null, false);
        country.results = country.filtered.doc_count;
        return country;
      }));

      data = this.props.prepareData.call(this, data, this.state.setA, this.state.setB);

      output =
      _jsx("div", { className: "item item-chart" }, void 0,
      _jsx("p", {}, void 0, this.props.label),
      _jsx(_Charts.StackedDualBarChart, { data: data, chartLabel: this.props.label }));


    }

    return (
      _jsx("div", { className: "item-group-charts", style: { paddingTop: '15px', paddingRight: '15px' } }, void 0, output));

  }}


CejilChart.defaultProps = {
  label: null };var _default =









CejilChart;exports.default = _default;