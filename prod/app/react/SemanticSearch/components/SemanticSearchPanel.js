"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.SemanticSearchSidePanel = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = require("immutable");
var _socket = _interopRequireDefault(require("../../socket"));
var _UI = require("../../UI");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));

var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _actions = require("../actions/actions");

var _SearchList = _interopRequireDefault(require("./SearchList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SemanticSearchSidePanel extends _react.Component {
  constructor(props) {
    super(props);

    this.registeredForUpdates = false;
    this.onSearchUpdated = this.onSearchUpdated.bind(this);

    _socket.default.on('semanticSearchUpdated', this.onSearchUpdated);
  }

  componentDidMount() {
    if (!this.registeredForUpdates) {
      this.props.registerForUpdates();
      this.registeredForUpdates = true;
    }
    this.props.fetchSearches();
  }

  componentWillUnmount() {
    _socket.default.removeListener('semanticSearchUpdated', this.onSearchUpdated);
  }

  onSearchUpdated({ updatedSearch }) {
    this.props.updateSearch(updatedSearch);
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  close() {
    this.props.hideSemanticSearch();
  }

  render() {
    const searches = this.props.searches.toJS();
    const { open } = this.props;
    return (
      _jsx(_SidePanel.default, { open: open, className: "metadata-sidepanel semantic-search" }, void 0,
      _jsx("button", { type: "button", className: "closeSidepanel close-modal", onClick: this.props.hideSemanticSearch }, void 0,
      _jsx(_UI.Icon, { icon: "times" })),

      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx(_ShowIf.default, { if: !!searches }, void 0,
      _jsx(_SearchList.default, { searches: searches })))));




  }}exports.SemanticSearchSidePanel = SemanticSearchSidePanel;











function mapStateToProps(state) {
  return {
    searches: state.semanticSearch.searches,
    search: state.semanticSearch.search,
    open: state.semanticSearch.showSemanticSearchPanel };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    fetchSearches: _actions.fetchSearches,
    submitNewSearch: _actions.submitNewSearch,
    registerForUpdates: _actions.registerForUpdates,
    updateSearch: _actions.updateSearch,
    hideSemanticSearch: _actions.hideSemanticSearch },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SemanticSearchSidePanel);exports.default = _default;