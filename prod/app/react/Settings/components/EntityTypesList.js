"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.EntityTypesList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _reactRouter = require("react-router");
var _templatesActions = require("../../Templates/actions/templatesActions");
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _Notifications = require("../../Notifications");
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class EntityTypesList extends _react.Component {
  setAsDefaultButton(template) {
    return (
      _jsx("button", { onClick: this.props.setAsDefault.bind(null, template), className: "btn btn-success btn-xs" }, void 0,
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Set as default'))));


  }

  deleteTemplate(template) {
    return this.props.checkTemplateCanBeDeleted(template).
    then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteTemplate(template);
        },
        title: `Confirm delete document type: ${template.name}`,
        message: `Are you sure you want to delete this document type?
        This will delete the template and all relationship properties from other templates pointing to this one.` });

    }).
    catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: `Can not delete document type: ${template.name}`,
        message: 'This document type has associated documents' });

    });
  }

  defaultTemplateMessage() {
    return (
      _jsx("span", {}, void 0,
      (0, _I18N.t)('System', 'Default template'),
      _jsx(_Tip.default, {}, void 0, "This template will be used as default for new entities.")));




  }

  deleteTemplateButton(template) {
    return (
      _jsx("button", { onClick: this.deleteTemplate.bind(this, template), className: "btn btn-danger btn-xs template-remove" }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Delete'))));


  }

  render() {
    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Templates')),
      _jsx("ul", { className: "list-group document-types" }, void 0,
      this.props.templates.toJS().map((template, index) =>
      _jsx("li", { className: "list-group-item" }, index,
      _jsx(_reactRouter.Link, { to: `/settings/templates/edit/${template._id}` }, void 0, template.name),
      template.default ? this.defaultTemplateMessage() : '',
      _jsx("div", { className: "list-group-item-actions" }, void 0,
      !template.default ? this.setAsDefaultButton(template) : '',
      _jsx(_reactRouter.Link, { to: `/settings/templates/edit/${template._id}`, className: "btn btn-default btn-xs" }, void 0,
      _jsx(_UI.Icon, { icon: "pencil-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Edit'))),

      !template.default ? this.deleteTemplateButton(template) : '')))),




      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_reactRouter.Link, { to: "/settings/templates/new", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Add template'))))));




  }}exports.EntityTypesList = EntityTypesList;










EntityTypesList.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps(state) {
  return { templates: state.templates };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)(_objectSpread({}, _Notifications.notificationActions, { deleteTemplate: _templatesActions.deleteTemplate, checkTemplateCanBeDeleted: _templatesActions.checkTemplateCanBeDeleted, setAsDefault: _templatesActions.setAsDefault }), dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(EntityTypesList);exports.default = _default;