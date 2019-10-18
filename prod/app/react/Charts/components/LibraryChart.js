"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.LibraryChartComponent = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");

var _Pie = _interopRequireDefault(require("./Pie"));
var _Bar = _interopRequireDefault(require("./Bar"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LibraryChartComponent extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { type: 'pie' };
    this.maxPieItems = 14;
    this.assignType = this.assignType.bind(this);
    this.typeButton = this.typeButton.bind(this);
  }

  assignType(type) {
    return () => {
      this.setState({ type });
    };
  }

  clusterResults(options) {
    return options.reduce((_clusteredResults, option, optionIndex) => {
      const clusteredResults = _clusteredResults;
      if (optionIndex < this.maxPieItems) {
        clusteredResults.push(option);
      }

      if (optionIndex === this.maxPieItems) {
        clusteredResults.push({ label: (0, _I18N.t)('System', 'Other'), results: option.results });
      }

      if (optionIndex > this.maxPieItems) {
        clusteredResults[clusteredResults.length - 1].results += option.results;
      }

      return clusteredResults;
    }, []);
  }

  typeButton(type) {
    const className = `btn btn-sm ${this.state.type === type ? 'btn-success' : 'btn-default'}`;
    return (
      _jsx("button", { className: className, onClick: this.assignType(type) }, void 0,
      _jsx("i", { className: `fa fa-${type}-chart` })));


  }

  render() {
    if (!this.props.options) {
      return null;
    }

    const chart = this.state.type === 'pie' ?
    _jsx(_Pie.default, { data: this.clusterResults(this.props.options) }) :
    _jsx(_Bar.default, { data: this.props.options, chartLabel: this.props.label });

    return (
      _jsx("div", { className: "item item-chart" }, void 0,
      _jsx("div", {}, void 0,
      _jsx("div", { className: "item-chart-type" }, void 0,
      this.typeButton('pie'),
      this.typeButton('bar')),

      _jsx("p", {}, void 0, this.props.label),
      chart)));



  }}exports.LibraryChartComponent = LibraryChartComponent;


LibraryChartComponent.defaultProps = {
  options: [],
  label: null };var _default =







(0, _reactRedux.connect)()(LibraryChartComponent);exports.default = _default;