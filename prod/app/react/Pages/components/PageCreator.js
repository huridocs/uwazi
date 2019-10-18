"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.PageCreator = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ReactReduxForms = require("../../ReactReduxForms");
var _pageActions = require("../actions/pageActions");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _Layout = require("../../Layout");
var _UI = require("../../UI");

var _ValidatePage = _interopRequireDefault(require("./ValidatePage"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class PageCreator extends _react.Component {
  componentWillUnmount() {
    const { resetPage } = this.props;
    resetPage();
  }

  render() {
    const { formState, page, savePage, savingPage } = this.props;
    const backUrl = '/settings/pages';
    const pageUrl = `/page/${page.data.sharedId}`;

    let nameGroupClass = 'template-name form-group';
    if (formState.title && !formState.title.valid && (formState.submitFailed || formState.title.touched)) {
      nameGroupClass += ' has-error';
    }

    return (
      _jsx("div", { className: "page-creator" }, void 0,
      _jsx(_reactReduxForm.Form, {
        model: "page.data",
        onSubmit: savePage,
        validators: (0, _ValidatePage.default)() }, void 0,

      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "metadataTemplate-heading panel-heading" }, void 0,
      _jsx("div", { className: nameGroupClass }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".title" }, void 0,
      _jsx("input", { placeholder: "Page name", className: "form-control" })))),



      _jsx("div", { className: "panel-body page-viewer document-viewer" }, void 0,
      _jsx(_ShowIf.default, { if: Boolean(page.data._id) }, void 0,
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "terminal" }), " ", pageUrl,
      _jsx("a", { target: "_blank", rel: "noopener noreferrer", href: pageUrl, className: "pull-right" }, void 0, "(view page)"))),


      _jsx(_ReactReduxForms.MarkDown, { htmlOnViewer: true, model: ".metadata.content", rows: 18 }),
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "Use ",
      _jsx("a", { target: "_blank", rel: "noopener noreferrer", href: "https://guides.github.com/features/mastering-markdown/" }, void 0, "Markdown"), " syntax to create page content",
      _jsx("br", {}), "You can also embed advanced components like maps, charts and document lists in your page.\xA0",


      _jsx("a", { target: "_blank", rel: "noopener noreferrer", href: "https://github.com/huridocs/uwazi/wiki/Components" }, void 0, "Click here"), " to learn more about the components.")),



      _jsx("div", {}, void 0,
      _jsx("div", {}, void 0, _jsx("span", { className: "form-group-label" }, void 0, "Page Javascript")),
      _jsx("div", { className: "alert alert-warning" }, void 0,
      _jsx(_UI.Icon, { icon: "exclamation-triangle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "With great power comes great responsibility!",
      _jsx("br", {}), _jsx("br", {}), "This area allows you to append custom Javascript to the page.  This opens up a new universe of possibilities.",
      _jsx("br", {}), "It could also very easily break the app.  Only write code here if you know exactly what you are doing.")),



      _jsx(_reactReduxForm.Field, { model: ".metadata.script" }, void 0,
      _jsx("textarea", { placeholder: "// Javascript - With great power comes great responsibility!", className: "form-control", rows: 12 }))))),




      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_Layout.BackButton, { to: backUrl }),
      _jsx("button", {
        type: "submit",
        className: "btn btn-success save-template",
        disabled: !!savingPage }, void 0,

      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, "Save"))))));





  }}exports.PageCreator = PageCreator;










function mapStateToProps({ page }) {
  return { page, formState: page.formState, savingPage: page.uiState.get('savingPage') };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ resetPage: _pageActions.resetPage, savePage: _pageActions.savePage }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(PageCreator);exports.default = _default;