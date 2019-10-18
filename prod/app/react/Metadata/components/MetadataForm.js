"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.MetadataForm = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reselect = require("reselect");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");
var _Forms = require("../../Forms");
var _filterBaseProperties = _interopRequireDefault(require("../../Entities/utils/filterBaseProperties"));
var _Notifications = require("../../Notifications");
var _I18N = require("../../I18N");
var _UI = require("../../UI");

var _immutable = _interopRequireDefault(require("immutable"));
var _IconField = _interopRequireDefault(require("./IconField"));
var _MetadataFormFields = _interopRequireDefault(require("./MetadataFormFields"));
var _validator = _interopRequireDefault(require("../helpers/validator"));
var _defaultTemplate = _interopRequireDefault(require("../helpers/defaultTemplate"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const immutableDefaultTemplate = _immutable.default.fromJS(_defaultTemplate.default);

const selectTemplateOptions = (0, _reselect.createSelector)(
s => s.templates,
templates => templates.
map(tmpl => ({ label: tmpl.get('name'), value: tmpl.get('_id') })));


class MetadataForm extends _react.Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  onSubmit(metadata) {
    this.props.onSubmit(_filterBaseProperties.default.filterBaseProperties(metadata), this.props.model);
  }

  onSubmitFailed() {
    this.props.notify((0, _I18N.t)('System', 'Invalid form', null, false), 'danger');
  }

  renderTemplateSelect(templateOptions, template) {
    if (templateOptions.size) {
      return (
        _jsx(_ReactReduxForms.FormGroup, {}, void 0,
        _jsx("ul", { className: "search__filter" }, void 0,
        _jsx("li", {}, void 0, _jsx("label", {}, void 0, (0, _I18N.t)('System', 'Type'))),
        _jsx("li", { className: "wide" }, void 0,
        _jsx(_Forms.Select, {
          className: "form-control",
          value: template.get('_id'),
          options: templateOptions.toJS(),
          onChange: e => {
            this.props.changeTemplate(this.props.model, e.target.value);
          } })))));





    }

    return (
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("div", { className: "text-center protip" }, void 0,
      _jsx(_UI.Icon, { icon: "lightbulb" }), " ", _jsx("b", {}, void 0, "ProTip!"),
      _jsx("span", {}, void 0, "You can create metadata templates in ",
      _jsx(_I18N.I18NLink, { to: "/settings" }, void 0, "settings"), "."))));




  }

  render() {
    const { model, template, templateOptions, id, multipleEdition } = this.props;

    if (!template) {
      return _jsx("div", {});
    }

    const titleLabel = template.get('commonProperties') ?
    template.get('commonProperties').find(p => p.get('name') === 'title').get('label') :
    'Title';

    return (
      _jsx(_reactReduxForm.Form, {
        id: id,
        model: model,
        onSubmit: this.onSubmit,
        validators: _validator.default.generate(template.toJS(), multipleEdition),
        onSubmitFailed: this.onSubmitFailed }, void 0,

      !multipleEdition &&
      _jsx(_ReactReduxForms.FormGroup, { model: ".title" }, void 0,
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0, _jsx("label", {}, void 0, _jsx(_I18N.Translate, { context: template.get('_id') }, void 0, titleLabel), " ", _jsx("span", { className: "required" }, void 0, "*"))),
      _jsx("li", { className: "wide" }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".title" }, void 0,
      _jsx("textarea", { className: "form-control" }))),


      _jsx(_IconField.default, { model: model }))),




      this.renderTemplateSelect(templateOptions, template),
      _jsx(_MetadataFormFields.default, { multipleEdition: multipleEdition, thesauris: this.props.thesauris, model: model, template: template })));


  }}exports.MetadataForm = MetadataForm;


MetadataForm.defaultProps = {
  id: 'metadataForm',
  multipleEdition: false };














function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ notify: _Notifications.notificationActions.notify }, dispatch);
}

const mapStateToProps = (state, ownProps) => ({
  template: ownProps.template ? ownProps.template : state.templates.find(tmpl => tmpl.get('_id') === ownProps.templateId) || immutableDefaultTemplate,
  templateOptions: selectTemplateOptions(state) });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(MetadataForm);exports.default = _default;