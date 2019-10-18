"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.dropTarget = exports.dragSource = exports.MetadataProperty = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactDnd = require("react-dnd");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _uiActions = require("../actions/uiActions");
var _modalActions = require("../../Modals/actions/modalActions");
var _templateActions = require("../actions/templateActions");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");
var _FormConfigInput = _interopRequireDefault(require("./FormConfigInput"));
var _FormConfigSelect = _interopRequireDefault(require("./FormConfigSelect"));
var _FormConfigRelationship = _interopRequireDefault(require("./FormConfigRelationship"));
var _FormConfigRelationshipFilter = _interopRequireDefault(require("./FormConfigRelationshipFilter"));
var _FormConfigNested = _interopRequireDefault(require("./FormConfigNested"));
var _FormConfigCommon = _interopRequireDefault(require("./FormConfigCommon"));
var _FormConfigMultimedia = _interopRequireDefault(require("./FormConfigMultimedia"));
var _Icons = _interopRequireDefault(require("./Icons"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class MetadataProperty extends _react.Component {
  isLabelDuplicated() {
    const { index, template, formState } = this.props;
    const commonPropIndex = index + template.commonProperties.length;
    return Boolean(formState.$form.errors[`properties.${index}.label.duplicated`]) ||
    Boolean(formState.$form.errors[`commonProperties.${commonPropIndex}.label.duplicated`]);
  }

  isErrorOnThisField(error) {
    const { index, isCommonProperty, template } = this.props;
    const commonPropIndex = index + template.commonProperties.length;
    const [errorRoot, errorIndex] = error.split('.');
    return errorRoot === 'commonProperties' ?
    errorIndex === commonPropIndex.toString() && isCommonProperty :
    errorIndex === index.toString() && !isCommonProperty;
  }

  renderForm() {
    const { type, index } = this.props;
    let defaultInput = _jsx(_FormConfigInput.default, { type: type, index: index });

    if (this.props.isCommonProperty) {
      return _jsx(_FormConfigCommon.default, { index: index, type: type });
    }
    if (type === 'relationship') {
      defaultInput = _jsx(_FormConfigRelationship.default, { index: index, type: type });
    }
    if (type === 'relationshipfilter') {
      defaultInput = _jsx(_FormConfigRelationshipFilter.default, { index: index, type: type });
    }
    if (type === 'select' || type === 'multiselect') {
      defaultInput = _jsx(_FormConfigSelect.default, { index: index, type: type });
    }
    if (type === 'nested') {
      defaultInput = _jsx(_FormConfigNested.default, { index: index, type: type });
    }
    if (type === 'media' || type === 'image' || type === 'preview') {
      defaultInput =
      _jsx(_FormConfigMultimedia.default, {
        type: type,
        index: index,
        canSetStyle: type === 'image' || type === 'preview',
        canBeRequired: type !== 'preview' });


    }
    if (type === 'geolocation' || type === 'link') {
      defaultInput = _jsx(_FormConfigInput.default, { type: type, index: index, canBeFilter: false });
    }
    return defaultInput;
  }

  render() {
    const { label, connectDragSource, isDragging, connectDropTarget, uiState, index, localID, inserting, formState } = this.props;
    const { editingProperty } = uiState.toJS();

    let propertyClass = 'list-group-item';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    const hasErrors = Object.keys(formState.$form.errors).
    reduce((result, error) => result || this.isErrorOnThisField(error) && formState.$form.errors[error], false);
    if (hasErrors && formState.$form.submitFailed) {
      propertyClass += ' error';
    }

    const iconClass = _Icons.default[this.props.type] || 'font';
    const beingEdited = editingProperty === localID;

    const property =
    _jsx("div", { className: propertyClass }, void 0,
    _jsx("span", { className: "property-name" }, void 0,
    _jsx(_UI.Icon, { icon: this.props.isCommonProperty ? 'lock' : 'bars', fixedWidth: true }),
    _jsx(_UI.Icon, { icon: iconClass, fixedWidth: true }), " ", label),

    _jsx("div", { className: "list-group-item-actions" }, void 0,

    this.isLabelDuplicated() &&
    _jsx("span", { className: "validation-error" }, void 0,
    _jsx(_UI.Icon, { icon: "exclamation-triangle" }), " Duplicated label"),


    Boolean(formState.$form.errors[`properties.${index}.relationType.duplicated`]) &&
    _jsx("span", { className: "validation-error" }, void 0,
    _jsx(_UI.Icon, { icon: "exclamation-triangle" }), " Relationship fields must have diferent relationship or diferent type of entity."),


    _jsx("button", {
      type: "button",
      className: "btn btn-default btn-xs property-edit",
      onClick: () => this.props.editProperty(beingEdited ? null : localID) }, void 0,

    _jsx(_UI.Icon, { icon: "pencil-alt" }), " Edit"),

    !this.props.isCommonProperty &&
    _jsx("button", {
      type: "button",
      className: "btn btn-danger btn-xs property-remove",
      onClick: () => this.props.removeProperty('RemovePropertyModal', index) }, void 0,

    _jsx(_UI.Icon, { icon: "trash-alt" }), " Delete")));






    if (this.props.isCommonProperty) {
      return (
        _jsx("li", {}, void 0,
        property,
        _jsx(_ShowIf.default, { if: beingEdited && !isDragging }, void 0,
        _jsx("div", { className: `propery-form${editingProperty === localID ? ' expand' : ''}` }, void 0,
        this.renderForm()))));




    }

    return connectDropTarget(
    _jsx("li", {}, void 0,
    connectDragSource(property),
    _jsx(_ShowIf.default, { if: beingEdited && !isDragging }, void 0,
    _jsx("div", { className: `propery-form${editingProperty === localID ? ' expand' : ''}` }, void 0,
    this.renderForm()))));




  }}exports.MetadataProperty = MetadataProperty;






















const target = {

  hover(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;
    const item = monitor.getItem();
    if (props.localID === item.editingProperty) {
      props.editProperty(null);
    }
    if (typeof dragIndex === 'undefined') {
      item.inserting = true;
      item.index = 0;
      props.addProperty({ label: item.label, type: item.type, inserting: true }, 0);
      return;
    }

    if (dragIndex === hoverIndex) {
      return;
    }

    if (item.alreadyReordered) {
      item.alreadyReordered = false;
      return;
    }

    props.reorderProperty(dragIndex, hoverIndex);
    item.index = hoverIndex;
    item.alreadyReordered = true;
  } };


const dropTarget = (0, _reactDnd.DropTarget)(['METADATA_PROPERTY', 'METADATA_OPTION'], target, connector => ({
  connectDropTarget: connector.dropTarget() }))(
MetadataProperty);exports.dropTarget = dropTarget;

const source = {
  beginDrag(props) {
    return {
      index: props.index,
      label: props.label,
      type: props.type,
      editingProperty: props.uiState.get('editingProperty') };

  },
  endDrag(props, monitor) {
    const item = monitor.getItem();
    props.editProperty(item.editingProperty);
  } };


const dragSource = (0, _reactDnd.DragSource)('METADATA_PROPERTY', source, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging() }))(
dropTarget);exports.dragSource = dragSource;

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ removeProperty: _modalActions.showModal, reorderProperty: _templateActions.reorderProperty, addProperty: _templateActions.addProperty, editProperty: _uiActions.editProperty }, dispatch);
}

const mapStateToProps = ({ template }) => ({
  uiState: template.uiState,
  formState: template.formState,
  template: template.data });var _default =




(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(dragSource);exports.default = _default;