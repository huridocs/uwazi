"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.dropTarget = exports.MetadataTemplate = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _reactDnd = require("react-dnd");
var _I18N = require("../../I18N");
var _reactReduxForm = require("react-redux-form");
var _Forms = require("../../Forms");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");
var _Notifications = require("../../Notifications");
var _colors = require("../../utils/colors");

var _templateActions = require("../actions/templateActions");
var _MetadataProperty = _interopRequireDefault(require("./MetadataProperty"));
var _RemovePropertyConfirm = _interopRequireDefault(require("./RemovePropertyConfirm"));
var _ColorPicker = _interopRequireDefault(require("../../Forms/components/ColorPicker"));
var _ValidateTemplate = _interopRequireDefault(require("./ValidateTemplate"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const getTemplateDefaultColor = (allTemplates, templateId) => {
  if (!templateId) {
    return _colors.COLORS[allTemplates.size % _colors.COLORS.length];
  }
  const index = allTemplates.findIndex(tpl => tpl.get('_id') === templateId);
  return _colors.COLORS[index % _colors.COLORS.length];
};

class MetadataTemplate extends _react.Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  onSubmit(_template) {
    const template = Object.assign({}, _template);
    template.properties = template.properties.map(_prop => {
      const prop = Object.assign({}, _prop);
      prop.label = _prop.label.trim();
      return prop;
    });

    this.props.saveTemplate(template);
  }

  onSubmitFailed() {
    this.props.notify((0, _I18N.t)('System', 'The template contains errors', null, false), 'danger');
  }

  render() {
    const { connectDropTarget, defaultColor } = this.props;
    const commonProperties = this.props.commonProperties || [];
    return (
      _jsx("div", {}, void 0,
      _jsx(_RemovePropertyConfirm.default, {}),
      _jsx(_reactReduxForm.Form, {
        model: "template.data",
        onSubmit: this.onSubmit,
        onSubmitFailed: this.onSubmitFailed,
        className: "metadataTemplate",
        validators: (0, _ValidateTemplate.default)(this.props.properties, commonProperties, this.props.templates.toJS(), this.props._id) }, void 0,

      _jsx("div", { className: "metadataTemplate-heading" }, void 0,
      _jsx(_Forms.FormGroup, { model: ".name" }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".name" }, void 0,
      _jsx("input", { placeholder: "Template name", className: "form-control" }))),


      defaultColor &&
      _jsx(_reactReduxForm.Control, {
        model: ".color",
        component: _ColorPicker.default,
        defaultValue: defaultColor,
        mapProps: {
          defaultValue: props => props.defaultValue } })),





      _jsx(_ShowIf.default, { if: !this.props.relationType }, void 0,
      connectDropTarget(
      _jsx("ul", { className: "metadataTemplate-list list-group" }, void 0,
      commonProperties.map((config, index) => {
        const localID = config.localID || config._id;
        return _react.default.createElement(_MetadataProperty.default, _extends({}, config, { key: localID, localID: localID, index: index - this.props.commonProperties.length }));
      }),
      this.props.properties.map((config, index) => {
        const localID = config.localID || config._id;
        return _react.default.createElement(_MetadataProperty.default, _extends({}, config, { key: localID, localID: localID, index: index }));
      }),
      _jsx("div", { className: "no-properties" }, void 0,
      _jsx("span", { className: "no-properties-wrap" }, void 0, _jsx(_UI.Icon, { icon: "clone" }), "Drag properties here"))))),




      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_I18N.I18NLink, { to: this.props.backUrl, className: "btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "arrow-left", directionAware: true }),
      _jsx("span", { className: "btn-label" }, void 0, "Back")),

      _jsx("button", { type: "submit", className: "btn btn-success save-template", disabled: !!this.props.savingTemplate }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, "Save"))))));





  }}exports.MetadataTemplate = MetadataTemplate;


MetadataTemplate.defaultProps = {
  savingTemplate: false,
  defaultColor: null };


















const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    const item = monitor.getItem();

    const propertyAlreadyAdded = props.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return;
    }

    props.addProperty({ label: item.label, type: item.type }, props.properties.length);
    return { name: 'container' };
  } };


const dropTarget = (0, _reactDnd.DropTarget)('METADATA_OPTION', target, connector => ({
  connectDropTarget: connector.dropTarget() }))(
MetadataTemplate);exports.dropTarget = dropTarget;



const mapStateToProps = ({ template, templates, relationTypes }, props) => {
  const _templates = props.relationType ? relationTypes : templates;
  return {
    _id: template.data._id,
    commonProperties: template.data.commonProperties,
    properties: template.data.properties,
    templates: _templates,
    savingTemplate: template.uiState.get('savingTemplate'),
    defaultColor: getTemplateDefaultColor(templates, template.data._id) };

};exports.mapStateToProps = mapStateToProps;

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ inserted: _templateActions.inserted, addProperty: _templateActions.addProperty, setErrors: _reactReduxForm.actions.setErrors, notify: _Notifications.notificationActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, null, { withRef: true })(dropTarget);exports.default = _default;