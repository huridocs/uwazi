"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Connection = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = require("immutable");
var _I18N = require("../../I18N");
var _Auth = require("../../Auth");
var _UI = require("../../UI");

var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _referencesActions = require("../actions/referencesActions");
var _uiActions = require("../actions/uiActions");
var _Layout = require("../../Layout");
var _reselect = require("reselect");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const selectDoc = (0, _reselect.createSelector)(
s => s.documentViewer.targetDoc,
s => s.documentViewer.doc,
(targetDoc, doc) => targetDoc.get('_id') ? targetDoc.toJS() : doc.toJS());


class Connection extends _react.Component {
  clickReference(reference) {
    if (this.props.readOnly) {
      return;
    }
    if (!this.props.targetDoc) {
      this.props.activateReference(reference, this.props.doc.pdfInfo, this.props.referencesSection);
    }
    if (this.props.targetDoc && typeof reference.range.start !== 'undefined') {
      this.props.selectReference(reference, this.props.doc.pdfInfo);
    }
  }

  deleteReference(reference) {
    this.context.confirm({
      accept: () => {
        this.props.deleteReference(reference);
      },
      title: 'Confirm delete connection',
      message: 'Are you sure you want to delete this connection?' });

  }

  relationType(id) {
    const type = this.props.relationTypes.find(relation => relation.get('_id') === id);
    if (type) {
      return type.name;
    }
  }

  render() {
    const useSourceTargetIcons = typeof this.props.useSourceTargetIcons !== 'undefined' ? this.props.useSourceTargetIcons : true;
    const { reference } = this.props;
    let itemClass = '';
    const disabled = this.props.targetDoc && typeof reference.range.start === 'undefined';
    const referenceIcon = 'fa-sign-out-alt';

    if (this.props.highlighted) {
      itemClass = 'relationship-hover';
    }

    if (this.props.active) {
      itemClass = 'relationship-active';
    }

    if (this.props.active && this.props.targetDoc && this.props.targetRange) {
      itemClass = 'relationship-selected';
    }

    if (this.props.readOnly) {
      itemClass = '';
    }

    const doc = (0, _immutable.fromJS)(reference.associatedRelationship.entityData);
    return (
      _jsx(_Layout.Item, {
        onMouseEnter: this.props.highlightReference.bind(null, reference._id),
        onMouseLeave: this.props.highlightReference.bind(null, null),
        onClick: this.clickReference.bind(this, reference),
        doc: doc,
        noMetadata: true,
        className: `${itemClass} item-${reference._id} ${disabled ? 'disabled' : ''} ${this.props.readOnly ? 'readOnly' : ''}`,
        "data-id": reference._id,
        additionalIcon:
        _jsx(_ShowIf.default, { if: useSourceTargetIcons }, void 0,
        _jsx("span", {}, void 0, _jsx("i", { className: `fa ${referenceIcon}` }), "\xA0")),


        additionalText: reference.associatedRelationship.range ? reference.associatedRelationship.range.text : null,
        additionalMetadata: [
        { label: 'Connection type', value: this.relationType(reference.template) }],

        evalPublished: true,
        buttons:
        _jsx("div", { className: "item-shortcut-group" }, void 0,
        _jsx(_ShowIf.default, { if: !this.props.targetDoc && !this.props.readOnly }, void 0,
        _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
        _jsx("a", { className: "item-shortcut btn btn-default btn-hover-danger", onClick: this.deleteReference.bind(this, reference) }, void 0,
        _jsx(_UI.Icon, { icon: "trash-alt" })))),




        _jsx(_ShowIf.default, { if: !this.props.targetDoc }, void 0,
        _jsx(_I18N.I18NLink, {
          to: `/${doc.get('file') ? 'document' : 'entity'}/${doc.get('sharedId')}`,
          onClick: e => e.stopPropagation(),
          className: "item-shortcut btn btn-default" }, void 0,

        _jsx(_UI.Icon, { icon: "file" })))) }));






  }}exports.Connection = Connection;


Connection.contextTypes = {
  confirm: _propTypes.default.func };


Connection.defaultProps = {
  targetDoc: false,
  useSourceTargetIcons: false };



















const mapStateToProps = (state, ownProps) => {
  const { documentViewer } = state;
  return {
    highlighted: documentViewer.uiState.get('highlightedReference') === ownProps.reference._id,
    active: documentViewer.uiState.get('activeReference') === ownProps.reference._id,
    targetRange: documentViewer.uiState.get('reference').get('targetRange'),
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    relationTypes: documentViewer.relationTypes,
    doc: selectDoc(state) };

};

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ highlightReference: _uiActions.highlightReference, activateReference: _uiActions.activateReference, selectReference: _uiActions.selectReference, deactivateReference: _uiActions.deactivateReference, deleteReference: _referencesActions.deleteReference }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Connection);exports.default = _default;