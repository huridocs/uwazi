"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.mapStateToProps = exports.SemanticSearchMultieditPanel = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var metadataActions = _interopRequireWildcard(require("../../Metadata/actions/actions"));
var _Multireducer = require("../../Multireducer");
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _immutable = _interopRequireDefault(require("immutable"));
var _UI = require("../../UI");
var _comonTemplate = _interopRequireDefault(require("../../Metadata/helpers/comonTemplate"));
var _MetadataForm = _interopRequireDefault(require("../../Metadata/components/MetadataForm"));
var _actions2 = require("../actions/actions");
var _reselect = require("reselect");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const getTemplates = (0, _reselect.createSelector)(
s => s.templates,
templates => templates.toJS());


const commonTemplateSelector = (0, _reselect.createSelector)(
getTemplates,
s => s.semanticSearch.multiedit,
_comonTemplate.default);


class SemanticSearchMultieditPanel extends _react.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
  }

  close() {
    this.props.resetForm(this.props.formKey);
    this.props.setEntities([]);
  }

  metadataFieldModified(key) {
    return !this.props.formState.metadata[key].pristine && (
    !this.props.formState.metadata[key].$form || !this.props.formState.metadata[key].$form.pristine);
  }

  save(formValues) {
    const { entities, template, formState, searchId } = this.props;
    const modifiedValues = { metadata: {} };
    Object.keys(formValues.metadata).forEach(key => {
      if (this.metadataFieldModified(key)) {
        modifiedValues.metadata[key] = formValues.metadata[key];
      }
    });

    if (template.get('_id')) {
      modifiedValues.template = template.get('_id');
    }

    if (formState.icon && !formState.icon.pristine) {
      modifiedValues.icon = formValues.icon;
    }
    return this.props.multipleUpdate(entities, modifiedValues).
    then(() => {
      this.close();
      this.props.getSearch(searchId);
    });
  }

  changeTemplate(formModel, template) {
    const updatedEntities = this.props.entities.map(entity => entity.set('template', template));
    this.props.setEntities(updatedEntities);
  }

  cancel() {
    const { confirm } = this.context;
    confirm({
      accept: () => {
        this.close();
      },
      title: (0, _I18N.t)('System', 'Confirm', null, false),
      message: (0, _I18N.t)('System', 'Discard changes', null, false) });

  }

  renderEditingForm() {
    const { formKey, thesauris } = this.props;

    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("div", { className: "alert alert-warning" }, void 0,
      _jsx(_UI.Icon, { icon: "exclamation-triangle", size: "2x" }),
      _jsx("p", {}, void 0, "Warning: you are editing multiple files. Fields marked with a ",

      _jsx(_UI.Icon, { icon: "exclamation-triangle" }), " will be updated with the same value.")),


      _jsx(_MetadataForm.default, {
        id: "multiEdit",
        model: formKey,
        onSubmit: this.save,
        thesauris: thesauris,
        template: this.props.template,
        changeTemplate: this.changeTemplate,
        multipleEdition: true })));



  }

  renderEditingButtons() {
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("button", { type: "button", onClick: this.cancel, className: "cancel-edit-metadata btn btn-primary" }, void 0,
      _jsx(_UI.Icon, { icon: "times" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Cancel'))),

      _jsx("button", { type: "submit", form: "multiEdit", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save')))));



  }

  render() {
    const { open } = this.props;
    return (
      _jsx(_SidePanel.default, { open: open, className: "multi-edit" }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("button", { type: "button", className: "closeSidepanel close-modal", onClick: this.close }, void 0,
      _jsx(_UI.Icon, { icon: "times" }))),


      _jsx("div", { className: "sidepanel-body" }, void 0,
      this.renderEditingForm()),

      _jsx("div", { className: "sidepanel-footer" }, void 0,
      this.renderEditingButtons())));



  }}exports.SemanticSearchMultieditPanel = SemanticSearchMultieditPanel;


SemanticSearchMultieditPanel.defaultProps = {
  template: null,
  open: false };
















SemanticSearchMultieditPanel.contextTypes = {
  confirm: _propTypes.default.func };


const mapStateToProps = state => {
  const entities = state.semanticSearch.multiedit;
  return {
    template: commonTemplateSelector(state),
    thesauris: state.thesauris,
    entities,
    open: Boolean(entities.size),
    formState: state.semanticSearch.multipleEditForm };

};exports.mapStateToProps = mapStateToProps;

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    loadForm: metadataActions.loadTemplate,
    resetForm: metadataActions.resetReduxForm,
    setEntities: _actions2.setEditSearchEntities,
    getSearch: _actions2.getSearch,
    multipleUpdate: metadataActions.multipleUpdate },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SemanticSearchMultieditPanel);exports.default = _default;