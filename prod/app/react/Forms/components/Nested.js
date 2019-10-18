"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _MarkDown = _interopRequireDefault(require("./MarkDown"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Nested extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.parseValue(this.props.value) };
  }

  parseValue(rows = []) {
    if (!rows[0]) {
      return '';
    }

    const keys = Object.keys(rows[0]).sort();
    let result = `| ${keys.join(' | ')} |\n`;
    result += `| ${keys.map(() => '-').join(' | ')} |\n`;
    result += `${rows.map(row => `| ${keys.map(key => (row[key] || []).join(',')).join(' | ')}`).join(' |\n')} |`;

    return result;
  }

  onChange(e) {
    const value = e.target.value || '';
    let formatedValues = [];
    this.setState({ value });
    if (value) {
      const rows = value.split('\n').filter(row => row);
      const keys = rows[0].split('|').map(key => key.trim()).filter(key => key);
      const entries = rows.splice(2);
      formatedValues = entries.map(row => row.split('|').splice(1).reduce((result, val, index) => {
        if (!keys[index]) {
          return result;
        }
        const values = val.split(',').map(v => v.trim()).filter(v => v);
        result[keys[index]] = values;
        return result;
      }, {}));
    }

    this.props.onChange(formatedValues);
  }

  render() {
    return _jsx(_MarkDown.default, { onChange: this.onChange.bind(this), value: this.state.value });
  }}exports.default = Nested;