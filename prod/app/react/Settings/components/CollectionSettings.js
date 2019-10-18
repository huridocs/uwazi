"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.CollectionSettings = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _moment = _interopRequireDefault(require("moment"));
var _utils = require("../../utils");
var _reactRouter = require("react-router");
var _RequestParams = require("../../utils/RequestParams");

var _BasicReducer = require("../../BasicReducer");
var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));
var _Notifications = require("../../Notifications");
var _ReactReduxForms = require("../../ReactReduxForms");
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _reactReduxForm = require("react-redux-form");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class CollectionSettings extends _react.Component {
  static dateFormatSeparatorOptions() {
    return [
    { label: '/', value: '/' },
    { label: '-', value: '-' }];

  }

  static landingPageOptions() {
    return [
    { label: 'Library', value: false },
    { label: 'Custom Page', value: true }];

  }

  static dateFormatOptions(separator) {
    return [
    { label: 'Year, Month, Day', value: 0, separator },
    { label: 'Day, Month, Year', value: 1, separator },
    { label: 'Month, Day, Year', value: 2, separator }];

  }

  static getDateFormatValue(format, separator) {
    const formatOptions = [
    `YYYY${separator}MM${separator}DD`,
    `DD${separator}MM${separator}YYYY`,
    `MM${separator}DD${separator}YYYY`];


    return formatOptions.indexOf(format);
  }

  static getDateFormat(value, separator) {
    const formatOptions = [
    `YYYY${separator}MM${separator}DD`,
    `DD${separator}MM${separator}YYYY`,
    `MM${separator}DD${separator}YYYY`];


    return formatOptions[value];
  }

  static renderDateFormatLabel(option) {
    const { separator, label, value } = option;
    return _jsx("span", {}, void 0, label, " ", _jsx("code", {}, void 0, (0, _moment.default)().format(CollectionSettings.getDateFormat(value, separator))));
  }

  constructor(props, context) {
    super(props, context);
    const { settings } = this.props;
    const dateSeparator = props.settings.dateFormat && props.settings.dateFormat.includes('/') ? '/' : '-';
    const dateFormat = CollectionSettings.getDateFormatValue(settings.dateFormat, dateSeparator);
    const customLandingpage = Boolean(props.settings.home_page);
    const allowedPublicTemplatesString = settings.allowedPublicTemplates ? settings.allowedPublicTemplates.join(',') : '';
    this.state = Object.assign({}, settings, { dateSeparator, customLandingpage, dateFormat, allowedPublicTemplatesString });
    this.updateSettings = this.updateSettings.bind(this);
  }

  updateSettings(values) {
    const settings = Object.assign({}, values);
    delete settings.customLandingpage;
    delete settings.dateSeparator;
    delete settings.allowedPublicTemplatesString;

    settings.dateFormat = CollectionSettings.getDateFormat(values.dateFormat, values.dateSeparator);

    if (!values.customLandingpage) {
      settings.home_page = '';
    }

    settings.allowedPublicTemplates = values.allowedPublicTemplatesString ? values.allowedPublicTemplatesString.split(',') : [];

    _SettingsAPI.default.save(new _RequestParams.RequestParams(settings)).
    then(result => {
      const { notify, setSettings } = this.props;
      notify((0, _I18N.t)('System', 'Settings updated', null, false), 'success');
      setSettings(result);
    });
  }

  render() {
    const hostname = _utils.isClient ? window.location.origin : '';
    const { dateSeparator, customLandingpage } = this.state;
    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Collection')),
      _jsx("div", { className: "panel-body" }, void 0,
      _jsx(_reactReduxForm.LocalForm, { id: "collectionSettingsForm", onSubmit: this.updateSettings, initialState: this.state, onChange: values => this.setState(values) }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collection_name" }, void 0, (0, _I18N.t)('System', 'Name')),
      _jsx(_reactReduxForm.Control.text, { id: "collection_name", model: ".site_name", className: "form-control" })),

      _jsx("div", { className: "form-group" }, void 0,
      _jsx("span", { className: "form-group-label" }, void 0, (0, _I18N.t)('System', 'Private instance')),
      _jsx("div", { className: "checkbox" }, void 0,
      _jsx("label", {}, void 0,
      _jsx(_reactReduxForm.Control.checkbox, { id: "collection_name", model: ".private" }),
      (0, _I18N.t)('System', 'check as private instance')))),



      _jsx("div", { className: "form-group" }, void 0,
      _jsx("span", { className: "form-group-label" }, void 0, (0, _I18N.t)('System', 'Date format')),
      _jsx("div", {}, void 0, (0, _I18N.t)('System', 'Separator')),
      _jsx(_ReactReduxForms.RadioButtons, {
        options: CollectionSettings.dateFormatSeparatorOptions(),
        model: ".dateSeparator" }),

      _jsx("div", {}, void 0, (0, _I18N.t)('System', 'Order')),
      _jsx(_ReactReduxForms.RadioButtons, {
        options: CollectionSettings.dateFormatOptions(dateSeparator),
        model: ".dateFormat",
        renderLabel: CollectionSettings.renderDateFormatLabel })),


      _jsx("h2", {}, void 0, (0, _I18N.t)('System', 'Advanced settings')),
      _jsx("div", { className: "form-group" }, void 0,
      _jsx("span", { className: "form-group-label" }, void 0, (0, _I18N.t)('System', 'Landing page')),
      _jsx(_ReactReduxForms.RadioButtons, {
        options: CollectionSettings.landingPageOptions(),
        model: ".customLandingpage" }),

      _jsx("div", { className: "input-group" }, void 0,
      _jsx("span", { disabled: !customLandingpage, className: "input-group-addon" }, void 0,
      hostname),

      _jsx(_reactReduxForm.Control.text, {
        disabled: !customLandingpage,
        model: ".home_page",
        className: "form-control" }))),



      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "home", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "The landing page is the first thing users will see when visiting your Uwazi instance.",
      _jsx("br", {}), "You can use any URL from your Uwazi instance as a landing page, examples:",

      _jsx("ul", {}, void 0,
      _jsx("li", {}, void 0, "A page: /page/dicxg0oagy3xgr7ixef80k9"),
      _jsx("li", {}, void 0, "Library results: /library/?searchTerm=test"),
      _jsx("li", {}, void 0, "An entity: /entity/9htbkgpkyy7j5rk9"),
      _jsx("li", {}, void 0, "A document: /document/4y9i99fadjp833di")), "Always use URLs relative to your site, starting with / and skipping the https://yoursite.com/.")),




      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "analyticsTrackingId" }, void 0, (0, _I18N.t)('System', 'Google Analytics ID')),
      _jsx(_reactReduxForm.Control.text, {
        model: ".analyticsTrackingId",
        className: "form-control" })),


      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "matomoConfig" }, void 0, (0, _I18N.t)('System', 'Matomo configuration')),
      _jsx(_reactReduxForm.Control.textarea, {
        model: ".matomoConfig",
        className: "form-control",
        rows: "5" })),


      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "question-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0,
      'This is a JSON configuration object like {"url": "matomo.server.url", "id": "site_id"}.')),


      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collectionMailerConfig" }, void 0, (0, _I18N.t)('System', 'Mailer configuration')),
      _jsx(_reactReduxForm.Control.textarea, {
        model: ".mailerConfig",
        className: "form-control",
        rows: "5" })),


      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "envelope", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "This is a JSON configuration object that should match the options values required by Nodemailer, as explained in ",

      _jsx("a", { href: "https://nodemailer.com/smtp/", target: "_blank", rel: "noopener noreferrer" }, void 0, "nodemailer.com/smtp/"), _jsx("br", {}), "This setting takes precedence over all other mailer configuration.",
      _jsx("br", {}), "If left blank, then the configuration file in /api/config/mailer.js will be used.")),



      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collectionContactEmail" }, void 0, (0, _I18N.t)('System', 'Contact email')),
      _jsx(_reactReduxForm.Control.text, {
        model: ".contactEmail",
        className: "form-control" })),


      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collectionPublicFormDestination" }, void 0, (0, _I18N.t)('System', 'Public Form destination')),
      _jsx(_reactReduxForm.Control.text, {
        id: "collectionPublicFormDestination",
        model: ".publicFormDestination",
        className: "form-control" })),


      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx("div", { className: "force-ltr" }, void 0, "You can configure the URL of a different Uwazi to receive the submits from your Public Form")),



      _jsx("div", { className: "form-group" }, void 0,
      _jsx("label", { className: "form-group-label", htmlFor: "collectionAllowedPublicTemplates" }, void 0, (0, _I18N.t)('System', 'Allowed Public Templates')),
      _jsx(_reactReduxForm.Control.text, {
        id: "collectionAllowedPublicTemplates",
        model: ".allowedPublicTemplatesString",
        className: "form-control" })),


      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx("div", { className: "force-ltr" }, void 0, "If you wish to include Public Forms on your pages, you must white-list the template IDs for which Public Forms are expected. Please include a comma-separated list of tempate IDs without spaces. For example:",

      _jsx("br", {}), "5d5b0698e28d130bc98efc8b,5d5d876aa77a121bf9cdd1ff")),



      _jsx("span", { className: "form-group-label" }, void 0, (0, _I18N.t)('System', 'Show Cookie policy')),
      _jsx("div", { className: "checkbox" }, void 0,
      _jsx("label", {}, void 0,
      _jsx(_reactReduxForm.Control.checkbox, {
        model: ".cookiepolicy",
        type: "checkbox" }),

      _jsx(_I18N.Translate, {}, void 0, "This option will show a notification about the use of cookies in your instance.")))),



      _jsx("h2", {}, void 0, (0, _I18N.t)('System', 'Advanced customizations')),
      _jsx("div", {}, void 0,
      _jsx(_reactRouter.Link, {
        to: "/settings/customisation",
        href: "/settings/customisation",
        className: "btn btn-default" }, void 0,

      (0, _I18N.t)('System', 'Custom Styles')), "\xA0",


      _jsx(_reactRouter.Link, {
        to: "/settings/custom-uploads",
        href: "/settings/custom-uploads",
        className: "btn btn-default" }, void 0,

      (0, _I18N.t)('System', 'Custom Uploads'))),


      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx("button", { type: "submit", form: "collectionSettingsForm", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save')))))));





  }}exports.CollectionSettings = CollectionSettings;








function mapStateToProps(state) {
  return { settings: state.settings.collection.toJS() };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ setSettings: _BasicReducer.actions.set.bind(null, 'settings/collection'), notify: _Notifications.notificationActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(CollectionSettings);exports.default = _default;