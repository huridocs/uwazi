"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.CreateConnectionPanel = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _UI = require("../../UI");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _I18N = require("../../I18N");

var _uiActions = require("../actions/uiActions");
var _actions = require("../actions/actions");
var _ActionButton = _interopRequireDefault(require("./ActionButton"));
var _SearchForm = _interopRequireDefault(require("./SearchForm"));
var _SearchResults = _interopRequireDefault(require("./SearchResults"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class CreateConnectionPanel extends _react.Component {
  renderCheckType(template) {
    if (this.props.connection.get('template') === template.get('_id')) {
      return _jsx(_UI.Icon, { icon: "check" });
    }

    return _jsx(_UI.Icon, { icon: ['far', 'square'] });
  }

  render() {
    const { uiState, searchResults } = this.props;
    const connection = this.props.connection.toJS();
    const typeLabel = connection.type === 'basic' ? 'Connection' : 'Reference';
    const open = Boolean(this.props.uiState.get('open') && this.props.containerId === connection.sourceDocument);
    const pdfInfo = this.props.pdfInfo ? this.props.pdfInfo.toJS() : null;
    const className = `${this.props.className} create-reference`;

    return (
      _jsx(_SidePanel.default, { open: open, className: className }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("h1", {}, void 0, "Create ", typeLabel),
      _jsx("button", { className: "closeSidepanel close-modal", onClick: this.props.closePanel }, void 0,
      _jsx(_UI.Icon, { icon: "times" })),

      _jsx("div", { className: "connections-list-title" }, void 0, (0, _I18N.t)('System', 'Select relationship type')),
      _jsx("ul", { className: "connections-list multiselect" }, void 0,
      this.props.relationTypes.map((template) =>
      _jsx("li", { onClick: () => this.props.setRelationType(template.get('_id')), className: "multiselectItem" }, template.get('_id'),
      _jsx("label", { className: "multiselectItem-label", htmlFor: template.get('_id') }, void 0,
      _jsx("span", { className: "multiselectItem-icon" }, void 0, this.renderCheckType(template)),
      _jsx("span", { className: "multiselectItem-name" }, void 0, template.get('name'))))))),






      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx("button", { className: "btn btn-primary", onClick: this.props.closePanel }, void 0,
      _jsx(_UI.Icon, { icon: "times" })),

      _jsx(_ShowIf.default, { if: connection.type !== 'targetRanged' }, void 0,
      _jsx(_ActionButton.default, {
        action: "save",
        onCreate: reference => {
          this.props.onCreate(reference, pdfInfo);
        } })),


      _jsx(_ShowIf.default, { if: connection.type === 'targetRanged' }, void 0,
      _jsx(_ActionButton.default, { action: "connect", onRangedConnect: this.props.onRangedConnect }))),



      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx("div", { className: "search-box" }, void 0,
      _jsx(_SearchForm.default, { connectionType: connection.type })),

      _jsx(_SearchResults.default, {
        results: searchResults,
        searching: uiState.get('searching'),
        selected: connection.targetDocument,
        onClick: this.props.setTargetDocument }))));




  }}exports.CreateConnectionPanel = CreateConnectionPanel;

















const mapStateToProps = ({ connections, relationTypes, documentViewer }) => ({
  uiState: connections.uiState,
  pdfInfo: documentViewer.doc.get('pdfInfo'),
  connection: connections.connection,
  searchResults: connections.searchResults,
  relationTypes });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ setRelationType: _actions.setRelationType, setTargetDocument: _actions.setTargetDocument, closePanel: _uiActions.closePanel }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(CreateConnectionPanel);exports.default = _default;