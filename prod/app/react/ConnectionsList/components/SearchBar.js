"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.SearchBar = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactReduxForm = require("react-redux-form");

var _debounce = _interopRequireDefault(require("../../utils/debounce"));
var _I18N = require("../../I18N");
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SearchBar extends _react.Component {
  componentWillMount() {
    this.changeSearchTerm = (0, _debounce.default)(this.props.searchReferences, 400);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entityId !== nextProps.entityId) {
      this.resetSearchTerm();
    }
  }

  componentWillUnmount() {
    this.resetSearchTerm();
  }

  resetSearchTerm() {
    this.props.change('relationships/list/search.searchTerm', '');
  }

  resetSearch() {
    this.resetSearchTerm();
    this.props.searchReferences();
  }

  render() {
    const { search } = this.props;
    const searchTerm = search.searchTerm && search.searchTerm.value ? search.searchTerm.value : '';

    return (
      _jsx("div", { className: "search-box" }, void 0,
      _jsx(_reactReduxForm.Form, { model: "relationships/list/search", onSubmit: this.props.searchReferences, autoComplete: "off" }, void 0,
      _jsx("div", { className: `input-group${searchTerm ? ' is-active' : ''}` }, void 0,
      _jsx(_reactReduxForm.Field, { model: "relationships/list/search.searchTerm" }, void 0,
      _jsx(_UI.Icon, { icon: "search" }),
      _jsx("input", {
        type: "text",
        placeholder: (0, _I18N.t)('System', 'Search related entities or documents', null, false),
        className: "form-control",
        onChange: this.changeSearchTerm.bind(this),
        autoComplete: "off",
        value: searchTerm }),

      _jsx(_UI.Icon, { icon: "times", onClick: this.resetSearch.bind(this) }))))));





  }}exports.SearchBar = SearchBar;









function mapStateToProps({ relationships }) {
  const { entityId, search } = relationships.list;
  return {
    entityId,
    search };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    searchReferences: _actions.searchReferences,
    change: _reactReduxForm.actions.change },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SearchBar);exports.default = _default;