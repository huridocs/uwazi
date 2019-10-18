"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.DocumentSidePanel = void 0;var _reactTabsRedux = require("react-tabs-redux");
var _reactRouter = require("react-router");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireWildcard(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Metadata = require("../../Metadata");
var _Auth = require("../../Auth");
var _I18N = require("../../I18N");
var _AttachmentsList = _interopRequireDefault(require("../../Attachments/components/AttachmentsList"));
var _ConnectionsList = _interopRequireDefault(require("../../Viewer/components/ConnectionsList"));
var _ConnectionsList2 = require("../../ConnectionsList");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _DocumentResults = _interopRequireDefault(require("../../SemanticSearch/components/DocumentResults"));
var _UI = require("../../UI");

var viewerModule = _interopRequireWildcard(require("../../Viewer"));
var _SearchText = _interopRequireDefault(require("./SearchText"));
var _ShowToc = _interopRequireDefault(require("./ShowToc"));
var _SnippetsTab = _interopRequireDefault(require("./SnippetsTab"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class DocumentSidePanel extends _react.Component {
  constructor(props) {
    super(props);
    this.selectTab = this.selectTab.bind(this);
    this.firstRender = true;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.doc.get('_id') && newProps.doc.get('_id') !== this.props.doc.get('_id') && this.props.getDocumentReferences) {
      this.props.getDocumentReferences(newProps.doc.get('sharedId'), this.props.storeKey);
    }
  }

  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS()).
        then(() => {
          const currentPath = _reactRouter.browserHistory.getCurrentLocation().pathname;
          const isLibraryorUploads = /library|uploads|^\/$|^\/..\/$/;
          if (!currentPath.match(isLibraryorUploads)) {
            _reactRouter.browserHistory.goBack();
          }
        });
      },
      title: 'Confirm',
      message: 'Are you sure you want to delete this item?' });

  }

  selectTab(tabSelected) {
    this.props.showTab(tabSelected);
  }

  close() {
    if (this.props.formDirty) {
      this.context.confirm({
        accept: () => {
          this.props.resetForm(this.props.formPath);
          this.props.closePanel();
        },
        title: 'Confirm',
        message: 'All changes will be lost, are you sure you want to proceed?' });

      return;
    }
    this.props.resetForm(this.props.formPath);
    this.props.closePanel();
  }

  render() {
    const { doc, docBeingEdited, DocumentForm, readOnly, references, EntityForm,
      connectionsGroups, isTargetDoc, excludeConnectionsTab, relationships } = this.props;
    const TocForm = this.props.tocFormComponent;

    const docAttachments = doc.get('attachments') ? doc.get('attachments').toJS() : [];
    const docFile = Object.assign({}, doc.get('file') ? doc.get('file').toJS() : {});
    const attachments = doc.get('file') ? [docFile].concat(docAttachments) : docAttachments;

    const isEntity = !this.props.doc.get('file');

    let { tab } = this.props;
    if (isEntity && (tab === 'references' || tab === 'toc')) {
      tab = 'metadata';
    }

    const summary = connectionsGroups.reduce((summaryData, g) => {
      g.get('templates').forEach(template => {
        summaryData.totalConnections += template.get('count');
      });
      return summaryData;
    }, { totalConnections: 0 });

    return (
      _jsx(_SidePanel.default, { open: this.props.open, className: "metadata-sidepanel" }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("button", { className: "closeSidepanel close-modal", onClick: this.close.bind(this) }, void 0,
      _jsx(_UI.Icon, { icon: "times" })),

      _jsx(_reactTabsRedux.Tabs, { selectedTab: tab, renderActiveTabContentOnly: true, handleSelect: this.selectTab }, void 0,
      _jsx("ul", { className: "nav nav-tabs" }, void 0,
      (() => {
        if (!this.props.raw && doc.get('semanticSearch')) {
          return (
            _jsx("li", {}, void 0,
            _jsx(_reactTabsRedux.TabLink, { to: "semantic-search-results" }, void 0,
            _jsx(_UI.Icon, { icon: "flask" }),
            _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Semantic search results')))));



        }
      })(),
      (() => {
        if (!this.props.raw) {
          return (
            _jsx("li", {}, void 0,
            _jsx(_reactTabsRedux.TabLink, { to: "text-search" }, void 0,
            _jsx(_SnippetsTab.default, { storeKey: this.props.storeKey }))));



        }
      })(),
      (() => {
        if (!isEntity && !this.props.raw) {
          return (
            _jsx("li", {}, void 0,
            _jsx(_reactTabsRedux.TabLink, { to: "toc" }, void 0,
            _jsx(_UI.Icon, { icon: "font" }),
            _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Table of Content')))));



        }
        return _jsx("span", {});
      })(),
      (() => {
        if (!isEntity && !this.props.raw) {
          return (
            _jsx("li", {}, void 0,
            _jsx(_reactTabsRedux.TabLink, { to: "references" }, void 0,
            _jsx(_UI.Icon, { icon: "sitemap" }),
            _jsx("span", { className: "connectionsNumber" }, void 0, references.size),
            _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'References')))));



        }
        return _jsx("span", {});
      })(),
      (() => {
        if (!this.props.raw) {
          return _jsx("li", { className: "tab-separator" });
        }
        return _jsx("span", {});
      })(),
      _jsx("li", {}, void 0,
      _jsx(_reactTabsRedux.TabLink, { to: "metadata", default: true }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Info')))),


      (() => {
        if (!isTargetDoc && !excludeConnectionsTab) {
          return (
            _jsx("li", {}, void 0,
            _jsx(_reactTabsRedux.TabLink, { to: "connections" }, void 0,
            _jsx(_UI.Icon, { icon: "exchange-alt" }),
            _jsx("span", { className: "connectionsNumber" }, void 0, summary.totalConnections),
            _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Connections')))));



        }
      })()))),



      _jsx(_ShowIf.default, { if: this.props.tab === 'metadata' || !this.props.tab }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx(_Metadata.MetadataFormButtons, {
        delete: this.deleteDocument.bind(this),
        data: this.props.doc,
        formStatePath: this.props.formPath,
        entityBeingEdited: docBeingEdited,
        includeViewButton: !docBeingEdited && readOnly,
        storeKey: this.props.storeKey }))),




      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: this.props.tab === 'toc' && this.props.tocBeingEdited }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx("button", { type: "submit", form: "tocForm", className: "edit-toc btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, "Save"))))),





      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: this.props.tab === 'toc' && !this.props.tocBeingEdited && !readOnly }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx("button", { onClick: () => this.props.editToc(this.props.doc.get('toc').toJS() || []), className: "edit-toc btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "pencil-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, "Edit"))))),





      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx(_reactTabsRedux.Tabs, { selectedTab: this.props.tab || 'metadata' }, void 0,
      _jsx(_reactTabsRedux.TabContent, { for: "text-search" }, void 0,
      _jsx(_SearchText.default, { doc: doc, storeKey: this.props.storeKey, searchTerm: this.props.searchTerm })),

      _jsx(_reactTabsRedux.TabContent, { for: "toc" }, void 0,
      _jsx(_ShowIf.default, { if: !this.props.tocBeingEdited }, void 0,
      _jsx(_ShowToc.default, { toc: doc.get('toc'), readOnly: readOnly })),

      _jsx(_ShowIf.default, { if: this.props.tocBeingEdited }, void 0,
      _jsx(TocForm, {
        removeEntry: this.props.removeFromToc,
        indent: this.props.indentTocElement,
        onSubmit: this.props.saveToc,
        model: "documentViewer.tocForm",
        state: this.props.tocFormState,
        toc: this.props.tocForm }))),



      _jsx(_reactTabsRedux.TabContent, { for: "metadata" }, void 0,
      (() => {
        if (docBeingEdited && !isEntity) {
          return _jsx(DocumentForm, { storeKey: this.props.storeKey });
        }
        if (docBeingEdited && isEntity) {
          return _jsx(EntityForm, { storeKey: this.props.storeKey });
        }
        return (
          _jsx("div", {}, void 0,
          _jsx(_Metadata.ShowMetadata, { relationships: relationships, entity: this.props.doc.toJS(), showTitle: true, showType: true }),
          _jsx(_AttachmentsList.default, {
            files: (0, _immutable.fromJS)(attachments),
            readOnly: false,
            isTargetDoc: isTargetDoc,
            isDocumentAttachments: Boolean(doc.get('file')),
            parentId: doc.get('_id'),
            parentSharedId: doc.get('sharedId'),
            storeKey: this.props.storeKey })));



      })()),

      _jsx(_reactTabsRedux.TabContent, { for: "references" }, void 0,
      _jsx(_ConnectionsList.default, {
        referencesSection: "references",
        references: references,
        readOnly: readOnly })),


      _jsx(_reactTabsRedux.TabContent, { for: "connections" }, void 0,
      _jsx(_ConnectionsList2.ConnectionsGroups, {})),

      _jsx(_reactTabsRedux.TabContent, { for: "semantic-search-results" }, void 0,
      _jsx(_DocumentResults.default, { doc: this.props.doc.toJS() }))))));





  }}exports.DocumentSidePanel = DocumentSidePanel;


DocumentSidePanel.defaultProps = {
  tab: 'metadata',
  open: false,
  tocBeingEdited: false,
  docBeingEdited: false,
  searchTerm: '',
  references: _immutable.default.fromJS([]),
  relationships: _immutable.default.fromJS([]),
  tocFormState: {},
  formDirty: false,
  isTargetDoc: false,
  readOnly: false,
  getDocumentReferences: undefined };




































DocumentSidePanel.contextTypes = {
  confirm: _propTypes.default.func };


DocumentSidePanel.defaultProps = {
  tocFormComponent: () => false,
  DocumentForm: () => false,
  EntityForm: () => false,
  raw: false };


const mapStateToProps = (state, ownProps) => {
  const isTargetDoc = state.documentViewer.targetDoc.get('_id');
  const relevantReferences = isTargetDoc ? viewerModule.selectors.selectTargetReferences(state) : viewerModule.selectors.selectReferences(state);
  const references = ownProps.references ? viewerModule.selectors.parseReferences(ownProps.doc, ownProps.references) : relevantReferences;
  return {
    references,
    excludeConnectionsTab: Boolean(ownProps.references),
    connectionsGroups: state.relationships.list.connectionsGroups,
    relationships: ownProps.references };

};exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps)(DocumentSidePanel);exports.default = _default;