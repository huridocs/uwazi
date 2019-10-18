"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ItemList = void 0;var _react = _interopRequireWildcard(require("react"));
var _immutable = require("immutable");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _queryString = _interopRequireDefault(require("query-string"));

var _Lists = require("../../Layout/Lists");
var _Doc = _interopRequireDefault(require("../../Library/components/Doc"));
var _I18N = require("../../I18N");
var _libraryActions = require("../../Library/actions/libraryActions");
var _Multireducer = require("../../Multireducer");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _slider = _interopRequireDefault(require("./slider"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ItemList extends _react.Component {
  render() {
    const { items, link } = this.props;
    const { sort } = _queryString.default.parse(link.substring(link.indexOf('?')));
    const searchParams = sort ? { sort } : { sort: 'title' };

    const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)({
      onClick: (e, item) => (0, _libraryActions.selectSingleDocument)(item) },
    (0, _Multireducer.wrapDispatch)(dispatch, 'library'));

    const toRenderItems = items.map((item, index) => {
      const ConnectedItem = (0, _reactRedux.connect)(null, mapDispatchToProps)(_Doc.default);
      return _jsx(ConnectedItem, { doc: (0, _immutable.fromJS)(item), searchParams: searchParams, storeKey: "library" }, index);
    });

    let list = _jsx(_Lists.RowList, {}, void 0, toRenderItems);

    if (this.props.options.slider) {
      list = _jsx(_Lists.RowList, {}, void 0, _jsx(_slider.default, { visibleCount: 3 }, void 0, toRenderItems));
    }

    return (
      _jsx("div", {}, void 0,
      list,
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "col-sm-12 text-center" }, void 0,
      _jsx(_I18N.I18NLink, { to: `${link}` }, void 0,
      _jsx("button", { className: "btn btn-default" }, void 0, (0, _I18N.t)('System', 'View in library')))))));





  }}exports.ItemList = ItemList;


ItemList.defaultProps = {
  items: [],
  options: {} };var _default =








ItemList;exports.default = _default;