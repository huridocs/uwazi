"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.ThesauriForm = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Layout = require("../../Layout");
var _DragAndDrop = require("../../Layout/DragAndDrop");
var _UI = require("../../UI");
var _validator = require("../../Metadata/helpers/validator");
var _thesauriActions = require("../actions/thesauriActions");
var _FormGroup = _interopRequireDefault(require("../../DocumentForm/components/FormGroup"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));

var _ThesauriFormItem = _interopRequireDefault(require("./ThesauriFormItem"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function sanitizeThesauri(thesaurus) {
  const sanitizedThesauri = Object.assign({}, thesaurus);
  sanitizedThesauri.values = sanitizedThesauri.values.
  filter(value => value.label).
  filter(value => !value.values || value.values.length).
  map(value => {
    const _value = Object.assign({}, value);
    if (_value.values) {
      _value.values = _value.values.filter(_v => _v.label);
    }
    return _value;
  });
  return sanitizedThesauri;
}

class ThesauriForm extends _react.Component {
  static validation(thesauris, id) {
    return {
      name: {
        duplicated: val => !thesauris.find(thesauri => thesauri.type !== 'template' &&
        thesauri._id !== id &&
        thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()),
        required: _validator.notEmpty } };


  }

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onImportClicked = this.onImportClicked.bind(this);
    this.import = this.import.bind(this);
    this.fileInputRef = _react.default.createRef();
    this.fileFormRef = _react.default.createRef();
  }

  componentWillMount() {
    this.firstLoad = true;
  }


  componentWillReceiveProps(props) {
    props.thesauri.values.forEach((value, index) => {
      if (value.values && (!value.values.length || value.values[value.values.length - 1].label !== '')) {
        props.addValue(index);
      }
    });

    if (!props.thesauri.values.length || props.thesauri.values[props.thesauri.values.length - 1].label !== '') {
      props.addValue();
    }
  }

  componentDidUpdate(previousProps) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }
    const { values } = this.props.thesauri;
    const previousValues = previousProps.thesauri.values;
    const addedValue = values.length > previousProps.thesauri.values.length;
    const lasValueIsGroup = values.length && values[values.length - 1].values;
    const previousLasValueWasGroup = previousValues.length && previousValues[previousValues.length - 1].values;
    if (lasValueIsGroup && (!previousLasValueWasGroup || addedValue)) {
      this.groups[this.groups.length - 1].focus();
    }
  }

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  onChange(values, groupIndex) {
    this.props.updateValues(values, groupIndex);
  }

  onImportClicked() {
    this.fileInputRef.current.click();
  }

  import() {
    const file = this.fileInputRef.current.files[0];
    this.fileFormRef.current.reset();
    const thes = sanitizeThesauri(this.props.thesauri);
    if (file) {
      this.props.importThesauri(thes, file);
    }
  }

  save(thesauri) {
    const sanitizedThesauri = sanitizeThesauri(thesauri);
    this.props.saveThesauri(sanitizedThesauri);
  }

  renderItem(value, index) {
    return (
      _react.default.createElement(_ThesauriFormItem.default, {
        ref: f => this.groups.push(f),
        value: value,
        index: index,
        removeValue: this.props.removeValue,
        onChange: this.onChange }));


  }

  render() {
    const isNew = this.props.new;
    const id = this.props.thesauri._id;
    const { values } = this.props.thesauri;
    if (!isNew && !id) {
      return false;
    }
    this.groups = [];
    return (
      _jsx("div", { className: "thesauri" }, void 0,
      _jsx(_reactReduxForm.Form, {
        model: "thesauri.data",
        onSubmit: this.save,
        validators: ThesauriForm.validation(this.props.thesauris.toJS(), this.props.thesauri._id) }, void 0,

      _jsx("div", { className: "panel panel-default thesauri" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0,
      _react.default.createElement(_FormGroup.default, _extends({}, this.props.state.name, { submitFailed: this.props.state.submitFailed }),
      _jsx(_reactReduxForm.Field, { model: ".name" }, void 0,
      _jsx("input", { id: "thesauriName", className: "form-control", type: "text", placeholder: "Thesauri name" }),
      _jsx(_ShowIf.default, { if: this.props.state.$form.touched && this.props.state.name && this.props.state.name.errors.duplicated }, void 0,
      _jsx("div", { className: "validation-error" }, void 0,
      _jsx(_UI.Icon, { icon: "exclamation-triangle", size: "xs" }), " Duplicated name"))))),





      _jsx("div", { className: "thesauri-values" }, void 0,
      _jsx("div", { className: "" }, void 0,
      _jsx("b", {}, void 0, "Items:")),

      _jsx(_DragAndDrop.DragAndDropContainer, {
        onChange: this.onChange,
        renderItem: this.renderItem,
        items: values,
        iconHandle: true })),


      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_Layout.BackButton, { to: "/settings/dictionaries" }),
      _jsx("a", { className: "btn btn-primary", onClick: this.props.addGroup }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, "Add group")),

      _jsx("a", { className: "btn btn-primary", onClick: this.props.sortValues }, void 0,
      _jsx(_UI.Icon, { icon: "sort-alpha-down" }),
      _jsx("span", { className: "btn-label" }, void 0, "Sort")),

      _jsx("button", { type: "button", className: "btn btn-primary import-template", onClick: this.onImportClicked }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }),
      _jsx("span", { className: "btn-label" }, void 0, "Import")),

      _jsx("button", { type: "submit", className: "btn btn-success save-template" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, "Save"))))),




      _react.default.createElement("form", { ref: this.fileFormRef, style: { display: 'none' } },
      _react.default.createElement("input", {
        ref: this.fileInputRef,
        type: "file",
        accept: "text/csv",
        style: { display: 'none' },
        onChange: this.import }))));




  }}exports.ThesauriForm = ThesauriForm;


ThesauriForm.defaultProps = {
  new: false };


















function mapStateToProps(state) {
  return {
    thesauri: state.thesauri.data,
    thesauris: state.thesauris,
    state: state.thesauri.formState };

}

function bindActions(dispatch) {
  return (0, _redux.bindActionCreators)({
    saveThesauri: _thesauriActions.saveThesauri,
    importThesauri: _thesauriActions.importThesauri,
    addValue: _thesauriActions.addValue,
    addGroup: _thesauriActions.addGroup,
    sortValues: _thesauriActions.sortValues,
    removeValue: _thesauriActions.removeValue,
    updateValues: _thesauriActions.updateValues,
    resetForm: _reactReduxForm.actions.reset,
    setInitial: _reactReduxForm.actions.setInitial,
    validate: _reactReduxForm.actions.validate },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, bindActions, null, { withRef: true })(ThesauriForm);exports.default = _default;