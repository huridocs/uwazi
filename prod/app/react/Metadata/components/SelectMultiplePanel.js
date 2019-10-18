"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.SelectMultiplePanel = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var _actions = require("../../Entities/actions/actions");
var metadataActions = _interopRequireWildcard(require("../actions/actions"));
var _reselect = require("reselect");
var _Multireducer = require("../../Multireducer");
var _advancedSort = require("../../utils/advancedSort");
var _TemplateLabel = _interopRequireDefault(require("../../Layout/TemplateLabel"));
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _immutable = _interopRequireDefault(require("immutable"));
var _UI = require("../../UI");
var _MetadataForm = _interopRequireDefault(require("./MetadataForm"));
var _comonTemplate = _interopRequireDefault(require("../helpers/comonTemplate"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const sortedTemplates = (0, _reselect.createSelector)(
s => s.templates,
templates => {
  const _templates = templates ? templates.toJS() : [];
  return (0, _advancedSort.advancedSort)(_templates, { property: 'name' });
});


const commonTemplate = (0, _reselect.createSelector)(
sortedTemplates,
s => s.entitiesSelected,
_comonTemplate.default);


class SelectMultiplePanel extends _react.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.delete = this.delete.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.edit = this.edit.bind(this);
    this.publish = this.publish.bind(this);
    this.unpublish = this.unpublish.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
  }

  close() {
    this.props.unselectAllDocuments();
    this.props.resetForm(this.props.formKey);
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntities(this.props.entitiesSelected.toJS());
      },
      title: (0, _I18N.t)('System', 'Confirm', null, false),
      message: (0, _I18N.t)('System', 'Confirm delete multiple items', null, false) });

  }

  metadataFieldModified(key) {
    return !this.props.formState.metadata[key].pristine && (
    !this.props.formState.metadata[key].$form || !this.props.formState.metadata[key].$form.pristine);
  }

  save(formValues) {
    const modifiedValues = { metadata: {} };
    const template = this.props.template.toJS();
    Object.keys(formValues.metadata).forEach(key => {
      if (this.metadataFieldModified(key)) {
        modifiedValues.metadata[key] = formValues.metadata[key];
      }
    });

    if (template._id) {
      modifiedValues.template = template._id;
    }

    if (this.props.formState.icon && !this.props.formState.icon.pristine) {
      modifiedValues.icon = formValues.icon;
    }

    return this.props.multipleUpdate(this.props.entitiesSelected, modifiedValues).
    then(updatedEntities => {
      this.props.updateEntities(updatedEntities);
      this.props.unselectAllDocuments();
      this.props.resetForm(this.props.formKey);
    });
  }

  publish() {
    this.context.confirm({
      accept: () => {
        this.props.multipleUpdate(this.props.entitiesSelected, { published: true });
      },
      title: (0, _I18N.t)('System', 'Confirm', null, false),
      message: (0, _I18N.t)('System', 'Confirm publish multiple items', null, false),
      type: 'success' });

  }

  unpublish() {
    this.context.confirm({
      accept: () => this.props.multipleUpdate(this.props.entitiesSelected, { published: false }),
      title: (0, _I18N.t)('System', 'Confirm', null, false),
      message: (0, _I18N.t)('System', 'Confirm unpublish multiple items', null, false),
      type: 'success' });

  }

  changeTemplate(formModel, template) {
    const updatedEntities = this.props.entitiesSelected.map(entity => entity.set('template', template));
    this.props.updateSelectedEntities(updatedEntities);
  }

  cancel() {
    this.context.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: (0, _I18N.t)('System', 'Confirm', null, false),
      message: (0, _I18N.t)('System', 'Discard changes', null, false) });

  }

  edit() {
    this.props.loadForm(this.props.formKey, this.props.template.toJS());
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

  renderListButtons(canBePublished, canBeUnPublished) {
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("button", { type: "button", onClick: this.edit, className: "edit btn btn-primary" }, void 0,
      _jsx(_UI.Icon, { icon: "pencil-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Edit'))),

      _jsx("button", { type: "button", className: "delete btn btn-danger", onClick: this.delete }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Delete'))),

      canBePublished &&
      _jsx("button", { type: "button", className: "publish btn btn-success", onClick: this.publish }, void 0,
      _jsx(_UI.Icon, { icon: "paper-plane" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Publish'))),


      canBeUnPublished &&
      _jsx("button", { type: "button", className: "unpublish btn btn-warning", onClick: this.unpublish }, void 0,
      _jsx(_UI.Icon, { icon: "paper-plane" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Unpublish')))));




  }

  renderList() {
    const { entitiesSelected, getAndSelectDocument } = this.props;
    return (
      _jsx("ul", { className: "entities-list" }, void 0,
      entitiesSelected.map((entity, index) => {
        const onClick = getAndSelectDocument.bind(this, entity.get('sharedId'));
        return (
          _jsx("li", { onClick: onClick }, index,
          _jsx("span", { className: "entity-title" }, void 0, entity.get('title')),
          _jsx(_TemplateLabel.default, { template: entity.get('template') })));


      })));


  }

  render() {
    const { entitiesSelected, open, editing } = this.props;
    const canBePublished = this.props.entitiesSelected.reduce((previousCan, entity) => {
      const isEntity = !entity.get('file');
      return previousCan && (entity.get('processed') || isEntity) && !entity.get('published') && !!entity.get('template');
    }, true);

    const canBeUnPublished = this.props.entitiesSelected.reduce((previousCan, entity) => previousCan && entity.get('published'), true);

    return (
      _jsx(_SidePanel.default, { open: open, className: "multi-edit" }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx(_UI.Icon, { icon: "check" }), " ", _jsx("span", {}, void 0, entitiesSelected.size, " ", (0, _I18N.t)('System', 'selected')),
      _jsx("button", { type: "button", className: "closeSidepanel close-modal", onClick: this.close }, void 0,
      _jsx(_UI.Icon, { icon: "times" }))),


      _jsx("div", { className: "sidepanel-body" }, void 0,
      !editing && this.renderList(),
      editing && this.renderEditingForm()),

      _jsx("div", { className: "sidepanel-footer" }, void 0,
      !editing && this.renderListButtons(canBePublished, canBeUnPublished),
      editing && this.renderEditingButtons())));



  }}exports.SelectMultiplePanel = SelectMultiplePanel;


SelectMultiplePanel.defaultProps = {
  entitiesSelected: _immutable.default.fromJS([]),
  template: null,
  open: false,
  editing: false };






















SelectMultiplePanel.contextTypes = {
  confirm: _propTypes.default.func };


const mapStateToProps = (state, props) => ({
  template: commonTemplate(props),
  open: props.entitiesSelected.size > 1,
  editing: Object.keys(props.state).length > 0 });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    deleteEntities: _actions.deleteEntities,
    loadForm: metadataActions.loadTemplate,
    resetForm: metadataActions.resetReduxForm,
    multipleUpdate: metadataActions.multipleUpdate },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);exports.default = _default;