"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Viewer = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _immutable = require("immutable");

var _ConnectionsList = require("../../ConnectionsList");
var _Connections = require("../../Connections");
var _Layout = require("../../Layout");
var _Relationships = require("../../Relationships");
var _I18N = require("../../I18N");
var _BasicReducer = require("../../BasicReducer");
var _AddEntities = _interopRequireDefault(require("../../Relationships/components/AddEntities"));
var _ContextMenu = _interopRequireDefault(require("../../ContextMenu"));
var _Footer = _interopRequireDefault(require("../../App/Footer"));
var _Marker = _interopRequireDefault(require("../utils/Marker"));
var _RelationshipMetadata = _interopRequireDefault(require("../../Relationships/components/RelationshipMetadata"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _RequestParams = require("../../utils/RequestParams");

var _Paginator = require("./Paginator");
var _referencesActions = require("../actions/referencesActions");
var _documentActions = require("../actions/documentActions");
var _uiActions = require("../actions/uiActions");
var _selectors = require("../selectors");
var _ConfirmCloseForm = _interopRequireDefault(require("./ConfirmCloseForm"));
var _SourceDocument = _interopRequireDefault(require("./SourceDocument"));
var _TargetDocument = _interopRequireDefault(require("./TargetDocument"));
var _ViewMetadataPanel = _interopRequireDefault(require("./ViewMetadataPanel"));
var _ViewerDefaultMenu = _interopRequireDefault(require("./ViewerDefaultMenu"));
var _ViewerTextSelectedMenu = _interopRequireDefault(require("./ViewerTextSelectedMenu"));

var _determineDirection = _interopRequireDefault(require("../utils/determineDirection"));
var _routeActions = require("../actions/routeActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class Viewer extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { firstRender: true };
    this.handlePlainTextClick = this.handlePlainTextClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;
    const { sidepanelTab } = this.props;

    store.dispatch((0, _uiActions.openPanel)('viewMetadataPanel'));
    if (sidepanelTab === 'connections') {
      store.dispatch(_BasicReducer.actions.set('viewer.sidepanel.tab', ''));
    }
  }

  componentDidMount() {
    const { store } = this.context;

    store.dispatch((0, _documentActions.loadDefaultViewerMenu)());
    _Marker.default.init('div.main-wrapper');
    this.setState({ firstRender: false }); // eslint-disable-line react/no-did-mount-set-state

    const { templates, doc } = this.props;

    if (doc.size && !doc.get('pdfInfo')) {
      (0, _routeActions.requestViewerState)(new _RequestParams.RequestParams({ sharedId: doc.get('sharedId') }), { templates: templates.toJS() }).
      then(viewerActions => {
        viewerActions.forEach(action => {
          store.dispatch(action);
        });
      });
    }
  }

  handlePlainTextClick() {
    const { showTab } = this.props;
    showTab('metadata');
  }

  prepareClassName() {
    const { panelIsOpen, targetDoc, showConnections } = this.props;

    let className = 'document-viewer';

    if (panelIsOpen) {
      className += ' with-panel is-active';
    }
    if (targetDoc) {
      className += ' show-target-document';
    }
    if (showConnections) {
      className += ' connections';
    }

    return className;
  }

  renderNoDoc() {
    const { doc } = this.props;
    return (
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "content-header content-header-document" }, void 0,
      _jsx("div", { className: "content-header-title" }, void 0,
      _jsx(_Layout.Icon, { icon: "lightbulb" }),
      _jsx(_I18N.Translate, {}, void 0, "This entity has no document, you probably want to see the metadata"), "\xA0",



      _jsx(_I18N.I18NLink, { to: `/entity/${doc.get('sharedId')}` }, void 0, _jsx(_I18N.Translate, {}, void 0, "view"))))));




  }


  render() {
    const { doc, sidepanelTab, targetDoc, changePage, onPageChange, onDocumentReady,
      addReference, loadTargetDocument, panelIsOpen, showTextSelectMenu } = this.props;
    const { firstRender } = this.state;
    if (doc.get('_id') && !doc.get('file')) {
      return this.renderNoDoc();
    }

    const className = this.prepareClassName();

    const { raw, searchTerm, pageText, page } = this.props;
    const documentTitle = doc.get('title') ? doc.get('title') : '';
    const documentFile = doc.get('file') ? doc.get('file').toJS() : {};

    return (
      _jsx("div", { className: "row" }, void 0,
      _jsx(_reactHelmet.default, { title: `${documentTitle} • Page ${page}` }),
      _jsx(_ShowIf.default, { if: !targetDoc }, void 0,
      _jsx("div", { className: "content-header content-header-document" }, void 0,
      _jsx("div", { className: "content-header-title" }, void 0,
      sidepanelTab !== 'connections' &&
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx(_Paginator.PaginatorWithPage, {
        totalPages: doc.get('totalPages'),
        onPageChange: changePage }),

      _jsx(_Layout.CurrentLocationLink, {
        onClick: !raw ? this.handlePlainTextClick : () => {},
        className: "btn btn-default",
        queryParams: { raw: raw || firstRender ? '' : 'true' } }, void 0,

      raw || firstRender ? _jsx(_I18N.Translate, {}, void 0, "Normal view") : _jsx(_I18N.Translate, {}, void 0, "Plain text")))))),






      _jsx("main", { className: className }, void 0,
      _jsx("div", { className: "main-wrapper" }, void 0,
      _jsx(_ShowIf.default, { if: sidepanelTab !== 'connections' && !targetDoc }, void 0,
      raw || firstRender ?
      _jsx("pre", { className: (0, _determineDirection.default)(documentFile) }, void 0, pageText) :
      _jsx(_SourceDocument.default, { searchTerm: searchTerm, onPageChange: onPageChange, onDocumentReady: onDocumentReady })),


      _jsx(_ShowIf.default, { if: sidepanelTab === 'connections' }, void 0,
      _jsx(_ConnectionsList.ConnectionsList, { hideFooter: true, searchCentered: true })),

      _jsx(_TargetDocument.default, {}),
      _jsx(_Footer.default, {}))),



      _jsx(_ConfirmCloseForm.default, {}),
      _jsx(_ViewMetadataPanel.default, { raw: raw || firstRender, storeKey: "documentViewer", searchTerm: searchTerm }),
      _jsx(_Connections.CreateConnectionPanel, {
        containerId: targetDoc ? 'target' : doc.get('sharedId'),
        onCreate: addReference,
        onRangedConnect: loadTargetDocument }),


      _jsx(_ShowIf.default, { if: sidepanelTab === 'connections' }, void 0,
      _jsx(_RelationshipMetadata.default, {})),


      _jsx(_ShowIf.default, { if: sidepanelTab === 'connections' }, void 0,
      _jsx(_AddEntities.default, {})),


      _jsx(_ShowIf.default, { if: sidepanelTab === 'connections' }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx(_Relationships.RelationshipsFormButtons, {}))),



      _jsx(_ContextMenu.default, { align: "bottom", overrideShow: true, show: !panelIsOpen }, void 0,
      _jsx(_ViewerDefaultMenu.default, {})),

      _jsx(_ContextMenu.default, { align: "center", overrideShow: true, show: showTextSelectMenu }, void 0,
      _jsx(_ViewerTextSelectedMenu.default, {}))));



  }}exports.Viewer = Viewer;


Viewer.defaultProps = {
  searchTerm: '',
  raw: false,
  onPageChange: () => {},
  changePage: () => {},
  onDocumentReady: () => {},
  page: 1,
  templates: (0, _immutable.List)(),
  doc: (0, _immutable.Map)() };

























Viewer.contextTypes = {
  store: _propTypes.default.object };



const mapStateToProps = state => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();
  return {
    pageText: documentViewer.rawText,
    doc: (0, _selectors.selectDoc)(state),
    panelIsOpen: !!uiState.panel,
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    templates: state.templates,
    // TEST!!!
    sidepanelTab: documentViewer.sidepanel.tab,
    showConnections: documentViewer.sidepanel.tab === 'references',
    showTextSelectMenu: Boolean(!documentViewer.targetDoc.get('_id') && uiState.reference && uiState.reference.sourceRange) };

};

const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)({
  addReference: _referencesActions.addReference,
  loadTargetDocument: _documentActions.loadTargetDocument,
  showTab: tab => _BasicReducer.actions.set('viewer.sidepanel.tab', tab) },
dispatch);var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Viewer);exports.default = _default;