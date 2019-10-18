"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.ImportPanel = void 0;var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");

var _I18N = require("../../I18N");
var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _UI = require("../../UI");
var _reactReduxForm = require("react-redux-form");
var _uploadsActions = require("../actions/uploadsActions");
var _ImportProgress = _interopRequireDefault(require("./ImportProgress"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class ImportPanel extends _react.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.close = this.close.bind(this);
  }

  close() {
    this.props.closeImportPanel();
  }

  handleSubmit(values) {
    this.props.importData(values.file, values.template);
  }

  renderForm() {
    const { templates } = this.props;
    const template = templates.find(templ => templ.get('default')).get('_id');
    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Upload a ZIP or CSV file."), "\xA0",
      _jsx("a", { rel: "noopener noreferrer", href: "https://github.com/huridocs/uwazi/wiki/Import-CSV", target: "_blank" }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Import instructions")))),



      _jsx(_reactReduxForm.LocalForm, { onSubmit: this.handleSubmit, id: "import", initialState: { template } }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", { htmlFor: "file" }, void 0, _jsx(_I18N.Translate, {}, void 0, "File"))),

      _jsx("li", { className: "wide" }, void 0,
      _jsx(_reactReduxForm.Control.file, { id: "file", model: ".file", accept: ".zip,.csv" })))),



      _jsx("div", { className: "form-group" }, void 0,
      _jsx("ul", { className: "search__filter" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", { htmlFor: "template" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Template"))),

      _jsx("li", { className: "wide" }, void 0,
      _jsx(_reactReduxForm.Control.select, { id: "template", model: ".template" }, void 0,
      templates.map(t => _jsx("option", { value: t.get('_id') }, t.get('_id'), t.get('name'))))))),




      _jsx("div", { className: "form-group" })),

      _jsx("div", { className: "sidepanel-footer" }, void 0,
      _jsx("button", { form: "import", type: "submit", className: "btn btn-primary" }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }), _jsx("span", { className: "btn-label" }, void 0, _jsx(_I18N.Translate, {}, void 0, "Import"))))));





  }

  renderUploadProgress() {
    const { uploadProgress } = this.props;
    return (
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "Uploading file ",
      uploadProgress, "%")));



  }

  renderContents() {
    const { uploadProgress, importStart, importProgress } = this.props;
    if (uploadProgress) {
      return this.renderUploadProgress();
    }

    if (importStart || importProgress) {
      return _jsx(_ImportProgress.default, {});
    }
    return this.renderForm();
  }

  render() {
    const { open } = this.props;
    return (
      _jsx(_SidePanel.default, { open: open, className: "metadata-sidepanel" }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("button", { type: "button", className: "closeSidepanel close-modal", onClick: this.close }, void 0,
      _jsx(_UI.Icon, { icon: "times" }))),


      this.renderContents()));


  }}exports.ImportPanel = ImportPanel;


ImportPanel.defaultProps = {
  open: false,
  uploadProgress: 0,
  importStart: false,
  importProgress: 0 };












const mapStateToProps = state => ({
  open: state.importEntities.showImportPanel,
  templates: state.templates,
  uploadProgress: state.importEntities.importUploadProgress,
  importStart: state.importEntities.importStart,
  importProgress: state.importEntities.importProgress });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ closeImportPanel: _uploadsActions.closeImportPanel, importData: _uploadsActions.importData }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ImportPanel);exports.default = _default;