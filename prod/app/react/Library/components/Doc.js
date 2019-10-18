"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.Doc = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _Auth = require("../../Auth");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _I18N = require("../../I18N");
var _UploadEntityStatus = _interopRequireDefault(require("./UploadEntityStatus"));
var _ViewDocButton = _interopRequireDefault(require("./ViewDocButton"));
var _UI = require("../../UI");

var _Layout = require("../../Layout");
var _immutable = require("immutable");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Doc extends _react.Component {
  shouldComponentUpdate(nextProps) {
    return !(0, _immutable.is)(this.props.doc, nextProps.doc) ||
    !(0, _immutable.is)(this.props.targetReference, nextProps.targetReference) ||
    this.props.additionalText !== nextProps.additionalText ||
    this.props.active !== nextProps.active ||
    this.props.searchParams && nextProps.searchParams && this.props.searchParams.sort !== nextProps.searchParams.sort;
  }

  onClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.doc, this.props.active);
    }
  }

  getConnections(connections) {
    return (
      _jsx("div", {}, void 0,
      connections.map((connection, index) =>
      _jsx("div", { className: "item-connection" }, index,
      _jsx("div", {}, void 0,
      _jsx(_UI.Icon, { icon: "exchange-alt" }),
      _jsx("span", {}, void 0,
      (0, _I18N.t)(connection.context, connection.label),
      connection.type === 'metadata' ? ` ${(0, _I18N.t)('System', 'in')}...` : '')),


      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: connection.sourceType !== 'metadata' }, void 0,
      _jsx("button", { className: "btn btn-default btn-hover-danger btn-xs", onClick: e => this.deleteConnection(e, connection) }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }))))))));








  }

  deleteConnection(e, connection) {
    e.stopPropagation();
    const { _id, sourceType } = connection;
    this.props.deleteConnection({ _id, sourceType });
  }

  render() {
    const { className, additionalText, targetReference } = this.props;
    const doc = this.props.doc.toJS();
    const { sharedId, file, processed } = doc;

    let itemConnections = null;
    if (doc.connections && doc.connections.length) {
      itemConnections = this.getConnections(doc.connections);
    }

    const buttons =
    _jsx("div", {}, void 0,
    _jsx(_ViewDocButton.default, {
      file: file,
      sharedId: sharedId,
      processed: processed,
      storeKey: this.props.storeKey,
      targetReference: targetReference }));




    return (
      _jsx(_Layout.Item, {
        onClick: this.onClick.bind(this),
        onSnippetClick: this.props.onSnippetClick,
        active: this.props.active,
        doc: this.props.doc,
        additionalText: additionalText,
        searchParams: this.props.searchParams,
        deleteConnection: this.props.deleteConnection,
        itemHeader: itemConnections,
        buttons: buttons,
        labels: _jsx(_UploadEntityStatus.default, { doc: this.props.doc }),
        className: className }));


  }}exports.Doc = Doc;


Doc.defaultProps = {
  targetReference: null };
















Doc.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps(state, ownProps) {
  const active = ownProps.storeKey ? !!state[ownProps.storeKey].ui.get('selectedDocuments').
  find(doc => doc.get('_id') === ownProps.doc.get('_id')) : false;
  return {
    active };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(Doc);exports.default = _default;