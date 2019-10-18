"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.RechartsPie = void 0;var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _recharts = require("recharts");

var _immutable = _interopRequireDefault(require("immutable"));

var _colorScheme = _interopRequireDefault(require("../utils/colorScheme"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function ellipsisString(string, maxLength) {
  if (string.length <= maxLength) {
    return string;
  }

  return `${string.substring(0, maxLength - 3)}...`;
}

class RechartsPie extends _react.Component {
  mountData(props) {
    let fullData = _immutable.default.fromJS([]);
    if (props.data) {
      fullData = _immutable.default.fromJS(props.data.map(item => ({ name: item.label, value: item.results, enabled: true })));
    }
    this.setState({ activeIndex: 0, fullData });
  }

  componentWillMount() {
    this.mountData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.mountData(nextProps);
    }
  }

  renderActiveShape(props) {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 22) * cos;
    const my = cy + (outerRadius + 22) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      _jsx("g", {}, void 0,
      _jsx("text", { x: cx, y: cy, dy: 8, textAnchor: "middle", fill: fill }, void 0, ellipsisString(payload.name, 14)),
      _jsx(_recharts.Sector, {
        cx: cx,
        cy: cy,
        innerRadius: innerRadius,
        outerRadius: outerRadius,
        startAngle: startAngle,
        endAngle: endAngle,
        fill: fill,
        stroke: "#fff" }),

      _jsx(_recharts.Sector, {
        cx: cx,
        cy: cy,
        startAngle: startAngle,
        endAngle: endAngle,
        innerRadius: outerRadius + 6,
        outerRadius: outerRadius + 10,
        fill: fill }),

      _jsx("path", { d: `M${sx},${sy}L${mx},${my}L${ex},${ey}`, stroke: fill, fill: "none" }),
      _jsx("circle", { cx: ex, cy: ey, r: 2, fill: fill, stroke: "none" }),
      _jsx("text", { x: ex + (cos >= 0 ? 1 : -1) * 12, y: ey, textAnchor: textAnchor, fill: "#333" }, void 0, `${payload.name}: ${value}`),
      _jsx("text", { x: ex + (cos >= 0 ? 1 : -1) * 12, y: ey, dy: 18, textAnchor: textAnchor, fill: "#999" }, void 0,
      `(${(percent * 100).toFixed(2)}%)`)));



  }

  getFilteredIndex(data, index) {
    const filteredIndexMap = {};
    let enabledIndices = -1;
    data.forEach((item, iterator) => {
      if (item.get('enabled')) {
        enabledIndices += 1;
        filteredIndexMap[iterator] = enabledIndices;
        return;
      }
      filteredIndexMap[iterator] = null;
    });

    return filteredIndexMap[index];
  }

  onIndexEnter(data, index) {
    this.setState({ activeIndex: index });
  }

  onFullIndexEnter(data, index) {
    this.onIndexEnter(null, this.getFilteredIndex(this.state.fullData, index));
  }

  onIndexClick(data, index) {
    const oldData = this.state.fullData;
    const enabled = !oldData.getIn([index, 'enabled']);
    let activeIndex = null;
    const fullData = oldData.setIn([index, 'enabled'], enabled);
    if (enabled) {
      activeIndex = this.getFilteredIndex(fullData, index);
    }

    this.setState({ activeIndex, fullData });
  }

  render() {
    const filteredColors = [];

    const fullData = this.state.fullData.toJS();

    const filteredData = fullData.reduce((results, item, index) => {
      if (item.enabled) {
        results.push(item);
        filteredColors.push(_colorScheme.default[index % _colorScheme.default.length]);
      }
      return results;
    }, []);

    return (
      _jsx(_recharts.ResponsiveContainer, { height: 320 }, void 0,
      _jsx(_recharts.PieChart, {}, void 0,
      _jsx(_recharts.Pie, {
        data: filteredData,
        dataKey: "value",
        cx: "50%",
        cy: "50%",
        innerRadius: 50,
        outerRadius: 80,
        activeIndex: this.state.activeIndex,
        activeShape: this.renderActiveShape,
        animationBegin: 200,
        animationDuration: 500,
        onMouseEnter: this.onIndexEnter.bind(this),
        onClick: this.onIndexEnter.bind(this),
        fill: "#8884d8" }, void 0,

      filteredData.map((entry, index) => _jsx(_recharts.Cell, { fill: filteredColors[index], opacity: 0.8 }, index))),


      _jsx(_recharts.Legend, {
        onMouseEnter: this.onFullIndexEnter.bind(this),
        onClick: this.onIndexClick.bind(this),
        payload: fullData.map((item, index) => ({
          value: item.name,
          type: 'rect',
          color: fullData[index].enabled ? _colorScheme.default[index % _colorScheme.default.length] : '#aaa',
          formatter: () => _jsx("span", { style: { color: fullData[index].enabled ? '#333' : '#999' } }, void 0, item.name) })) }))));





  }}exports.RechartsPie = RechartsPie;var _default =






(0, _reactRedux.connect)()(RechartsPie);exports.default = _default;