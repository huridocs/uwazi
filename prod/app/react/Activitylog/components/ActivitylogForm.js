"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapDispatchToProps = exports.mapStateToProps = void 0;var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _immutable = require("immutable");
var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var actions = _interopRequireWildcard(require("../actions/activitylogActions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ActivitylogForm extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { query: {} };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.methodOptions = [
    { label: 'POST', value: 'POST' },
    { label: 'GET', value: 'GET' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' }];

  }

  handleSubmit(values) {
    const { submit } = this.props;
    const query = Object.keys(values).reduce((_query, key) => {
      if (values[key]) {
        return Object.assign(_query, { [key]: values[key] });
      }
      return _query;
    }, {});

    this.setState({ query });
    submit(query);
  }

  loadMore() {
    const { searchResults, searchMore } = this.props;

    if (searchResults.get('remainingRows')) {
      const { query } = this.state;
      const lastResultTime = searchResults.getIn(['rows', -1, 'time']);
      searchMore(Object.assign({}, query, { before: lastResultTime }));
    }
  }

  render() {
    const { children, searchResults } = this.props;

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: "activity-log-form" }, void 0,
      _jsx(_reactReduxForm.LocalForm, { onSubmit: this.handleSubmit }, void 0,
      _jsx("div", { className: "form-group col-sm-12 col-md-6 col-lg-2" }, void 0,
      _jsx("label", { htmlFor: "find" }, void 0, "User"),
      _jsx(_reactReduxForm.Control.text, { className: "form-control", model: ".username", id: "username" })),

      _jsx("div", { className: "form-group col-sm-12 col-md-6 col-lg-4" }, void 0,
      _jsx("label", { htmlFor: "find" }, void 0, "Find"),
      _jsx(_reactReduxForm.Control.text, { className: "form-control", model: ".find", id: "find", placeholder: "by ids, methods, keywords, etc." })),

      _jsx("div", { className: "form-group col-sm-12 col-lg-6" }, void 0,
      _jsx("label", { htmlFor: "time" }, void 0, "Time"),
      _jsx(_ReactReduxForms.DateRange, { className: "form-control", model: ".time", id: "time", format: "YYYY-MM-DD", useTimezone: true })),

      _jsx("div", { className: "form-group col-sm-12" }, void 0, _jsx("input", { type: "submit", className: "btn btn-success", value: "Search" })))),



      children,

      _jsx("div", { className: "text-center" }, void 0,
      _jsx("button", {
        type: "button",
        className: `btn btn-default btn-load-more ${searchResults.get('remainingRows') ? '' : 'disabled'}`,
        onClick: () => {this.loadMore();} }, void 0,

      (0, _I18N.t)('System', 'x more')))));




  }}


ActivitylogForm.defaultProps = {
  children: null };









const mapStateToProps = ({ activitylog }) => ({ searchResults: activitylog.search });exports.mapStateToProps = mapStateToProps;

const mapDispatchToProps = (dispatch) =>
(0, _redux.bindActionCreators)({ submit: actions.activitylogSearch, searchMore: actions.activitylogSearchMore }, dispatch);exports.mapDispatchToProps = mapDispatchToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ActivitylogForm);exports.default = _default;