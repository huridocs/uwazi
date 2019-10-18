"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const normalizeIndex = (index, length) => index >= 0 ? index % length : length + index;

const getVisibleIndices = (centerIndex, visibleCount, totalLength) => {
  const minIndex = -Math.floor(visibleCount / 2);
  const rawIndices = [];
  for (let i = 0; i < visibleCount; i += 1) {
    rawIndices.push(centerIndex + minIndex + i);
  }
  return rawIndices.map(i => normalizeIndex(i, totalLength));
};

const getVisibleItems = (data, currentIndex, visibleCount) => {
  if (!data.length) {
    return [];
  }

  let visibleIndices = data.map((item, index) => index);

  if (data.length > visibleCount) {
    visibleIndices = getVisibleIndices(currentIndex, visibleCount, data.length);
  }

  const visibleItems = visibleIndices.map(i => data[i]);
  return visibleItems;
};

class VictimSlider extends _react.Component {
  constructor(props) {
    super(props);
    this.state = {
      // initialize slider with a victim that has an image
      currentIndex: 0 };

  }

  componentWillMount() {
    const { initialIndex } = this.props;
    this.setState({
      currentIndex: initialIndex || 0 });

  }

  slide(dir) {
    let { currentIndex } = this.state;
    const { children } = this.props;
    currentIndex = normalizeIndex(currentIndex + dir, children.length);
    this.setState({ currentIndex });
  }

  render() {
    const { children, visibleCount } = this.props;
    const { currentIndex } = this.state;
    const items = getVisibleItems(children, currentIndex, visibleCount);

    return (
      _jsx("div", { className: "slider" }, void 0,
      children.length > visibleCount &&
      _jsx("div", { className: "slider-buttons" }, void 0,
      _jsx("button", {
        className: "slider-btn",
        onClick: () => this.slide(-1) }, void 0,

      _jsx(_UI.Icon, { icon: "angle-left" })),

      _jsx("button", {
        className: "slider-btn",
        onClick: () => this.slide(1) }, void 0,

      _jsx(_UI.Icon, { icon: "angle-right" }))),



      _jsx("div", { className: "slider-items" }, void 0,
      items)));



  }}exports.default = VictimSlider;