"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.DocumentsList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRouter = require("react-router");
var _JSONRequest = require("../../shared/JSONRequest");
var _rison = _interopRequireDefault(require("rison"));

var _Doc = _interopRequireDefault(require("../Library/components/Doc"));
var _SearchBar = _interopRequireDefault(require("../Library/components/SearchBar"));
var _SortButtons = _interopRequireDefault(require("../Library/components/SortButtons"));

var _Lists = require("./Lists");
var _Loader = _interopRequireDefault(require("../components/Elements/Loader"));
var _Footer = _interopRequireDefault(require("../App/Footer"));
var _Auth = require("../Auth");
var _I18N = require("../I18N");
var _UI = require("../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class DocumentsList extends _react.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { loading: false };
    this.clickOnDocument = this.clickOnDocument.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({ loading: false });
  }

  clickOnDocument() {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument.apply(this, arguments);
    }
  }

  loadMoreDocuments(amount) {
    this.setState({ loading: true });this.setState({ loading: true });
    this.props.loadMoreDocuments(this.props.storeKey, this.props.documents.get('rows').size + amount);
  }

  loadMoreButton(amount) {
    const query = Object.assign({}, this.props.location.query);
    const q = query.q ? _rison.default.decode(query.q) : {};
    q.limit = (parseInt(q.limit, 10) || 30) + amount;
    query.q = _rison.default.encode(q);
    const url = `${this.props.location.pathname}${(0, _JSONRequest.toUrlParams)(query)}`;
    return (
      _jsx(_reactRouter.Link, { to: url, className: "btn btn-default btn-load-more", onClick: this.loadMoreDocuments.bind(this, amount) }, void 0,
      amount, " ", (0, _I18N.t)('System', 'x more')));


  }

  render() {
    const { documents, connections, GraphView, view, searchCentered, hideFooter,
      connectionsGroups, LoadMoreButton, rowListZoomLevel } = this.props;
    let counter = _jsx("span", {}, void 0, _jsx("b", {}, void 0, documents.get('totalRows')), " ", _jsx(_I18N.Translate, {}, void 0, "documents"));
    if (connections) {
      const summary = connectionsGroups.reduce((summaryData, g) => {
        g.get('templates').forEach(template => {
          summaryData.totalConnections += template.get('count');
        });
        return summaryData;
      }, { totalConnections: 0 });
      counter =
      _jsx("span", {}, void 0,
      _jsx("b", {}, void 0, summary.totalConnections), " ", (0, _I18N.t)('System', 'connections'), ", ", _jsx("b", {}, void 0, documents.get('totalRows')), " ", (0, _I18N.t)('System', 'documents'));


    }

    const Search = this.props.SearchBar;
    const ActionButtons = this.props.ActionButtons ? _jsx("div", { className: "search-list-actions" }, void 0, _jsx(this.props.ActionButtons, {})) : null;
    const FooterComponent = !hideFooter ? _jsx(_Footer.default, {}) : null;

    return (
      _jsx("div", { className: "documents-list" }, void 0,
      _jsx("div", { className: "main-wrapper" }, void 0,
      _jsx("div", { className: `search-list ${searchCentered ? 'centered' : ''}` }, void 0,
      ActionButtons,
      _jsx(Search, { storeKey: this.props.storeKey })),

      _jsx("div", { className: `sort-by ${searchCentered ? 'centered' : ''}` }, void 0,
      _jsx("div", { className: "documents-counter" }, void 0,
      _jsx("span", { className: "documents-counter-label" }, void 0, counter),
      _jsx("span", { className: "documents-counter-sort" }, void 0, (0, _I18N.t)('System', 'sorted by'), ":")),

      _jsx(_SortButtons.default, {
        sortCallback: this.props.searchDocuments,
        selectedTemplates: this.props.filters.get('documentTypes'),
        stateProperty: this.props.sortButtonsStateProperty,
        storeKey: this.props.storeKey })),


      (() => {
        if (view !== 'graph') {
          return (
            _jsx(_Lists.RowList, { zoomLevel: rowListZoomLevel }, void 0,
            documents.get('rows').map((doc, index) =>
            _jsx(_Doc.default, {
              doc: doc,
              storeKey: this.props.storeKey,

              onClick: this.clickOnDocument,
              onSnippetClick: this.props.onSnippetClick,
              deleteConnection: this.props.deleteConnection,
              searchParams: this.props.search }, index))));




        }

        if (view === 'graph') {
          return _jsx(GraphView, { clickOnDocument: this.clickOnDocument });
        }

        return null;
      })(),
      _jsx("div", { className: "row" }, void 0,
      (() => {
        if (view !== 'graph') {
          return (
            _jsx("p", { className: "col-sm-12 text-center documents-counter" }, void 0,
            _jsx("b", {}, void 0, " ", documents.get('rows').size, " "), (0, _I18N.t)('System', 'of'),
            _jsx("b", {}, void 0, " ", documents.get('totalRows'), " "), (0, _I18N.t)('System', 'documents')));


        }
        return null;
      })(),
      (() => {
        if (LoadMoreButton) {
          return _jsx(LoadMoreButton, {});
        }

        if (documents.get('rows').size < documents.get('totalRows') && !this.state.loading) {
          return (
            _jsx("div", { className: "col-sm-12 text-center" }, void 0,
            this.loadMoreButton(30),
            this.loadMoreButton(300)));


        }
        if (this.state.loading) {
          return _jsx(_Loader.default, {});
        }

        return null;
      })(),
      _jsx(_Auth.NeedAuthorization, {}, void 0,
      _jsx("div", { className: "col-sm-12 force-ltr text-center protip" }, void 0,
      _jsx(_UI.Icon, { icon: "lightbulb" }), " ", _jsx("b", {}, void 0, "ProTip!"),
      _jsx("span", {}, void 0, "Use ", _jsx("span", { className: "protip-key" }, void 0, "cmd"), " or ", _jsx("span", { className: "protip-key" }, void 0, "shift"), "\xA0 + click to select multiple files.")))),





      FooterComponent)));



  }}exports.DocumentsList = DocumentsList;


DocumentsList.defaultProps = {
  SearchBar: _SearchBar.default,
  rowListZoomLevel: 0 };var _default =



































(0, _reactRouter.withRouter)(DocumentsList);exports.default = _default;