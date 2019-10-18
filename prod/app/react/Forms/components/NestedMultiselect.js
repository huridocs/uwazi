"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _reactReduxForm = require("react-redux-form");
var _I18N = require("../../I18N");
var _advancedSort = require("../../utils/advancedSort");
var _ViolatedArticlesNestedProperties = _interopRequireDefault(require("../../Templates/components/ViolatedArticlesNestedProperties"));
var _store = require("../../store");
var _UI = require("../../UI");
var _MultiSelect = _interopRequireDefault(require("./MultiSelect"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class NestedMultiselect extends _react.Component {
  constructor(props) {
    super(props);
    const values = this.props.value || {};
    this.state = { values, filter: '' };
    if (!Object.keys(this.state.values).length) {
      this.state.values = props.property.nestedProperties.reduce((result, prop) => {
        result[prop.key] = [];
        return result;
      }, {});
    }
  }

  onChange(key, optionsSelected) {
    const values = Object.assign({}, this.state.values);
    values[key] = optionsSelected;
    this.setState({ values });
    this.props.onChange(values);
  }

  getOptions(prop, aggregations) {
    if (this.props.options) {
      return this.props.options;
    }

    if (!aggregations.all[this.props.property.name][prop]) {
      return [];
    }
    let options = aggregations.all[this.props.property.name][prop].buckets;
    if (options.length === 1 && options[0].key === 'missing') {
      return [];
    }
    options = options.
    map(item => ({ label: item.key, value: item.key, results: item.filtered.total.filtered.doc_count })).filter(option => option.results);
    return (0, _advancedSort.advancedSort)(options, { property: 'value', treatAs: 'dottedList', listTypes: [Number, Number, String] });
  }

  resetFilter() {
    this.setState({ filter: '' });
  }

  filter(e) {
    this.setState({ filter: e.target.value });
  }

  selectAnyChange(key, e) {
    const values = Object.assign({}, this.state.values);
    values[`${key}any`] = e.target.checked;
    values[key] = [];
    this.setState({ values });
    this.props.onChange(values);
  }

  toggleOptions(key, e) {
    e.preventDefault();
    const state = {};
    state[key] = !this.state[key];
    this.setState(state);
  }

  render() {
    const { property } = this.props;
    const { locale } = _store.store.getState();
    const aggregations = this.props.aggregations ? this.props.aggregations.toJS() : {};
    return (
      _jsx("ul", { className: "multiselect is-active" }, void 0,
      _jsx("li", { className: "multiselectActions" }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx(_UI.Icon, { icon: this.state.filter ? 'times-circle' : 'search', onClick: this.resetFilter.bind(this) }),
      _jsx("input", {
        className: "form-control",
        type: "text",
        placeholder: (0, _I18N.t)('System', 'Search item', null, false),
        value: this.state.filter,
        onChange: this.filter.bind(this) }))),



      (() => property.nestedProperties.map((prop, index) => {
        const options = this.getOptions(prop, aggregations);
        if (!options.length) {
          return false;
        }
        const label = _ViolatedArticlesNestedProperties.default[prop.toLowerCase()] ? _ViolatedArticlesNestedProperties.default[prop.toLowerCase()][`label_${locale}`] : prop;
        return (
          _jsx("li", {}, index,
          _jsx(_reactReduxForm.Field, { model: `.filters.${property.name}.properties.${prop}.any` }, void 0,
          _jsx("div", { className: "multiselectItem" }, void 0,
          _jsx("input", {
            type: "checkbox",
            className: "form-control multiselectItem-input",
            id: prop.key,
            onChange: this.selectAnyChange.bind(this, prop) }),

          _jsx("label", { htmlFor: prop, className: "multiselectItem-label" }, void 0,
          _jsx("span", { className: "multiselectItem-icon" }),
          _jsx("span", { className: "multiselectItem-name", title: label }, void 0, _jsx("b", {}, void 0, label))),

          _jsx("span", { className: "multiselectItem-results" }, void 0,
          _jsx("span", { className: "multiselectItem-action", onClick: this.toggleOptions.bind(this, prop) }, void 0,
          _jsx(_UI.Icon, { icon: this.state[prop] ? 'caret-up' : 'caret-down' }))))),




          _jsx(_ShowIf.default, { if: this.state[prop] }, void 0,
          _jsx(_reactReduxForm.Control, {
            component: _MultiSelect.default,
            model: `.filters.${property.name}.properties.${prop}.values`,
            prefix: property.name + prop,
            options: options,
            onChange: this.onChange.bind(this, prop),
            showAll: true,
            hideSearch: true,
            sortbyLabel: true,
            filter: this.state.filter }))));




      }))()));


  }}exports.default = NestedMultiselect;


NestedMultiselect.defaultProps = {
  value: {},
  options: undefined };