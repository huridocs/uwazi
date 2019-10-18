"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.EntityViewer = void 0;var _immutable = require("immutable");
var _reactTabsRedux = require("react-tabs-redux");
var _redux = require("redux");
var _reactRouter = require("react-router");
var _reactRedux = require("react-redux");
var _reselect = require("reselect");
var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Attachments = require("../../Attachments");
var _ConnectionsList = require("../../ConnectionsList");
var _Connections = require("../../Connections");



var _Metadata = require("../../Metadata");
var _Relationships = require("../../Relationships");
var _Layout = require("../../Layout");
var _actions = require("../../ConnectionsList/actions/actions");
var _I18N = require("../../I18N");
var _AddEntities = _interopRequireDefault(require("../../Relationships/components/AddEntities"));
var _RelationshipMetadata = _interopRequireDefault(require("../../Relationships/components/RelationshipMetadata"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _ContextMenu = _interopRequireDefault(require("../../ContextMenu"));
var _UI = require("../../UI");

var _ShowSidepanelMenu = _interopRequireDefault(require("./ShowSidepanelMenu"));
var _actions2 = require("../actions/actions");
var _uiActions = require("../actions/uiActions");
var _EntityForm = _interopRequireDefault(require("../containers/EntityForm"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class EntityViewer extends _react.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      panelOpen: true };

    this.deleteEntity = this.deleteEntity.bind(this);
    this.closePanel = this.closePanel.bind(this);
    this.openPanel = this.openPanel.bind(this);
  }

  deleteEntity() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntity(this.props.rawEntity.toJS()).
        then(() => {
          _reactRouter.browserHistory.goBack();
        });
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this entity?' });

  }

  deleteConnection(reference) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
        accept: () => {
          this.props.deleteConnection(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?' });

    }
  }

  closePanel() {
    this.setState({ panelOpen: false });
  }

  openPanel() {
    this.setState({ panelOpen: true });
  }


  render() {
    const { entity, entityBeingEdited, tab, connectionsGroups, relationships } = this.props;
    const { panelOpen } = this.state;
    const selectedTab = tab || 'info';

    const docAttachments = entity.attachments ? entity.attachments : [];
    const attachments = entity.file ? [entity.file].concat(docAttachments) : docAttachments;

    const summary = connectionsGroups.reduce((summaryData, g) => {
      g.get('templates').forEach(template => {
        summaryData.totalConnections += template.get('count');
      });
      return summaryData;
    }, { totalConnections: 0 });

    return (
      _jsx("div", { className: "row" }, void 0,
      _jsx(_reactHelmet.default, { title: entity.title ? entity.title : 'Entity' }),

      _jsx("div", { className: "content-header content-header-entity" }, void 0,
      _jsx("div", { className: "content-header-title" }, void 0,
      _jsx(_Layout.Icon, { className: "item-icon item-icon-center", data: entity.icon, size: "sm" }),
      _jsx("h1", { className: "item-name" }, void 0, entity.title),
      _jsx(_Layout.TemplateLabel, { template: entity.template }))),



      _jsx("main", { className: `entity-viewer ${panelOpen ? 'with-panel' : ''}` }, void 0,

      _jsx(_reactTabsRedux.Tabs, { selectedTab: selectedTab }, void 0,
      _jsx(_reactTabsRedux.TabContent, { for: selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none' }, void 0,
      _jsx("div", { className: "entity-metadata" }, void 0,
      (() => {
        if (entityBeingEdited) {
          return _jsx(_EntityForm.default, {});
        }
        return (
          _jsx("div", {}, void 0,
          _jsx(_Metadata.ShowMetadata, { relationships: relationships, entity: entity, showTitle: false, showType: false }),
          _jsx(_Attachments.AttachmentsList, {
            files: (0, _immutable.fromJS)(attachments),
            parentId: entity._id,
            parentSharedId: entity.sharedId,
            isDocumentAttachments: Boolean(entity.file),
            entityView: true,
            processed: entity.processed })));



      })())),


      _jsx(_reactTabsRedux.TabContent, { for: "connections" }, void 0,
      _jsx(_ConnectionsList.ConnectionsList, { deleteConnection: this.deleteConnection.bind(this), searchCentered: true })))),




      _jsx(_ShowIf.default, { if: selectedTab === 'info' || selectedTab === 'attachments' }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx(_Metadata.MetadataFormButtons, {
        delete: this.deleteEntity.bind(this),
        data: this.props.rawEntity,
        formStatePath: "entityView.entityForm",
        entityBeingEdited: entityBeingEdited }))),




      _jsx(_ShowIf.default, { if: selectedTab === 'connections' }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx(_Relationships.RelationshipsFormButtons, {}))),



      _jsx(_SidePanel.default, { className: `entity-connections entity-${this.props.tab}`, open: panelOpen }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("button", { type: "button", className: "closeSidepanel close-modal", onClick: this.closePanel.bind(this) }, void 0,
      _jsx(_UI.Icon, { icon: "times" })),

      _jsx(_reactTabsRedux.Tabs, {
        className: "content-header-tabs",
        selectedTab: selectedTab,
        handleSelect: tabName => {
          this.props.showTab(tabName);
        } }, void 0,

      _jsx("ul", { className: "nav nav-tabs" }, void 0,
      _jsx("li", {}, void 0,
      _jsx(_reactTabsRedux.TabLink, { to: "info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle" }),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Info')))),


      _jsx("li", {}, void 0,
      _jsx(_reactTabsRedux.TabLink, { to: "connections" }, void 0,
      _jsx(_UI.Icon, { icon: "exchange-alt" }),
      _jsx("span", { className: "connectionsNumber" }, void 0, summary.totalConnections),
      _jsx("span", { className: "tab-link-tooltip" }, void 0, (0, _I18N.t)('System', 'Connections'))))))),





      _jsx(_ShowIf.default, { if: selectedTab === 'info' || selectedTab === 'connections' }, void 0,
      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx(_ConnectionsList.ResetSearch, {}))),



      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx(_reactTabsRedux.Tabs, { selectedTab: selectedTab }, void 0,
      _jsx(_reactTabsRedux.TabContent, { for: selectedTab === 'info' || selectedTab === 'connections' ? selectedTab : 'none' }, void 0,
      _jsx(_ConnectionsList.ConnectionsGroups, {}))))),





      _jsx(_ContextMenu.default, { align: "bottom", overrideShow: true, show: !panelOpen, className: "show-info-sidepanel-context-menu" }, void 0,
      _jsx(_ShowSidepanelMenu.default, { className: "show-info-sidepanel-menu", panelIsOpen: panelOpen, openPanel: this.openPanel })),


      _jsx(_Connections.CreateConnectionPanel, { className: "entity-create-connection-panel", containerId: entity.sharedId, onCreate: this.props.connectionsChanged }),
      _jsx(_AddEntities.default, {}),
      _jsx(_RelationshipMetadata.default, {})));


  }}exports.EntityViewer = EntityViewer;


EntityViewer.defaultProps = {
  relationships: (0, _immutable.fromJS)([]) };



















EntityViewer.contextTypes = {
  confirm: _propTypes.default.func };


const selectEntity = (0, _reselect.createSelector)(
state => state.entityView.entity,
entity => entity.toJS());


const selectRelationTypes = (0, _reselect.createSelector)(s => s.relationTypes, r => r.toJS());

const mapStateToProps = state => ({
  rawEntity: state.entityView.entity,
  relationTypes: selectRelationTypes(state),
  entity: selectEntity(state),
  relationships: state.entityView.entity.get('relationships'),
  connectionsGroups: state.relationships.list.connectionsGroups,
  entityBeingEdited: !!state.entityView.entityForm._id,
  tab: state.entityView.uiState.get('tab'),
  library: state.library });


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    deleteEntity: _actions2.deleteEntity,
    connectionsChanged: _actions.connectionsChanged,
    deleteConnection: _actions.deleteConnection,
    showTab: _uiActions.showTab,
    startNewConnection: _Connections.actions.startNewConnection },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(EntityViewer);exports.default = _default;