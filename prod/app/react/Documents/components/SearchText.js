"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.SearchText = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var _reactReduxForm = require("react-redux-form");
var _libraryActions = require("../../Library/actions/libraryActions");
var _uiActions = require("../../Viewer/actions/uiActions");
var _reactRouter = require("react-router");
var _UI = require("../../UI");
var _SearchTips = _interopRequireDefault(require("../../Library/components/SearchTips"));
var _JSONRequest = require("../../../shared/JSONRequest");
var _SnippetList = _interopRequireDefault(require("./SnippetList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SearchText extends _react.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
  }

  componentDidMount() {
    if (this.props.storeKey === 'documentViewer') {
      this.searchSnippets(
      this.props.searchTerm,
      this.props.doc.get('sharedId'));

    }
  }

  componentWillReceiveProps(nextProps) {
    if (
    nextProps.searchTerm !== this.props.searchTerm ||
    nextProps.doc.get('sharedId') !== this.props.doc.get('sharedId'))
    {
      this.searchSnippets(nextProps.searchTerm, nextProps.doc.get('sharedId'));
    }
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetSearch() {}

  searchSnippets(searchTerm, sharedId) {
    if (sharedId) {
      this.props.searchSnippets(searchTerm, sharedId, this.props.storeKey);
      if (this.formDispatch) {
        this.formDispatch(
        _reactReduxForm.actions.change('searchText.searchTerm', searchTerm));

      }
    }
  }

  submit(value) {
    const path = _reactRouter.browserHistory.getCurrentLocation().pathname;
    const { query } = _reactRouter.browserHistory.getCurrentLocation();
    query.searchTerm = value.searchTerm;

    _reactRouter.browserHistory.push(path + (0, _JSONRequest.toUrlParams)(query));

    return this.props.searchSnippets(
    value.searchTerm,
    this.props.doc.get('sharedId'),
    this.props.storeKey);

  }

  render() {
    const { doc, snippets } = this.props;
    const documentViewUrl = doc.get('file') ? `/document/${doc.get('sharedId')}` : `/entity/${doc.get('sharedId')}`;
    return (
      _jsx("div", {}, void 0,
      _jsx(_reactReduxForm.LocalForm, {
        model: "searchText",
        onSubmit: this.submit,
        getDispatch: dispatch => this.attachDispatch(dispatch),
        autoComplete: "off" }, void 0,

      this.props.storeKey === 'documentViewer' &&
      _jsx("div", { className: "search-box" }, void 0,
      _jsx("div", { className: "input-group" }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".searchTerm" }, void 0,
      _jsx(_UI.Icon, { icon: "search" }),
      _jsx("input", {
        type: "text",
        placeholder: (0, _I18N.t)('System', 'Search', null, false),
        className: "form-control",
        autoComplete: "off" }),

      _jsx(_UI.Icon, { icon: "times", onClick: this.resetSearch }))),


      _jsx(_SearchTips.default, {}))),




      !snippets.get('count') &&
      _jsx("div", { className: "blank-state" }, void 0,
      _jsx(_UI.Icon, { icon: "search" }),
      _jsx("h4", {}, void 0,
      (0, _I18N.t)('System', !this.props.searchTerm ? 'Search text' : 'No text match')),

      _jsx("p", {}, void 0,
      (0, _I18N.t)('System', !this.props.searchTerm ? 'Search text description' : 'No text match description'))),



      doc.size ?
      _jsx(_SnippetList.default, {
        doc: this.props.doc,
        snippets: snippets,
        selectSnippet: this.props.selectSnippet,
        searchTerm: this.props.searchTerm,
        documentViewUrl: documentViewUrl }) :


      ''));



  }}exports.SearchText = SearchText;













SearchText.defaultProps = {
  searchTerm: '',
  snippets: {
    count: 0,
    metadata: [],
    fullText: [] } };



function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ searchSnippets: _libraryActions.searchSnippets, selectSnippet: _uiActions.selectSnippet }, dispatch);
}var _default =

(0, _reactRedux.connect)(
mapStateToProps,
mapDispatchToProps)(
SearchText);exports.default = _default;