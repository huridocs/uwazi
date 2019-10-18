"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.NavlinksSettings = void 0;var _reactDnd = require("react-dnd");
var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactDndHtml5Backend = _interopRequireDefault(require("react-dnd-html5-backend"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _UI = require("../../UI");
var _utils = require("../../utils");
var _navlinksActions = require("../actions/navlinksActions");
var _I18N = require("../../I18N");
var _ValidateNavlinks = _interopRequireDefault(require("../utils/ValidateNavlinks"));

var _NavlinkForm = _interopRequireDefault(require("./NavlinkForm"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class NavlinksSettings extends _react.Component {
  componentWillMount() {
    this.props.loadLinks(this.props.collection.get('links').toJS());
  }

  render() {
    const { collection, links } = this.props;
    const nameGroupClass = 'template-name';
    const hostname = _utils.isClient ? window.location.origin : '';

    const payload = { _id: collection.get('_id'), _rev: collection.get('_rev'), links };

    return (
      _jsx("div", { className: "NavlinksSettings" }, void 0,
      _jsx(_reactReduxForm.Form, {
        model: "settings.navlinksData",
        onSubmit: this.props.saveLinks.bind(this, payload),
        className: "navLinks",
        validators: (0, _ValidateNavlinks.default)(links) }, void 0,


      _jsx("div", { className: "panel panel-default" }, void 0,

      _jsx("div", { className: "panel-heading" }, void 0,
      _jsx("div", { className: nameGroupClass }, void 0,
      (0, _I18N.t)('System', 'Menu'))),


      _jsx("ul", { className: "list-group" }, void 0,
      _jsx("li", { className: "list-group-item" }, void 0,
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0, "If it is an external URL, use a fully formed URL. Ie. http://www.uwazi.io.",
      _jsx("br", {}), "If it is an internal URL within this website, be sure to delete the first part (",
      hostname, "), leaving only a relative URL starting with a slash character. Ie. /some_url."))),




      links.map((link, i) =>
      _jsx(_NavlinkForm.default, {

        index: i,
        id: link.localID || link._id,
        link: link,
        sortLink: this.props.sortLink }, link.localID || link._id))),



      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx("a", {
        className: "btn btn-primary",
        onClick: this.props.addLink.bind(this, links) }, void 0,

      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Add link'))),

      _jsx("button", {
        type: "submit",
        className: "btn btn-success",
        disabled: !!this.props.savingNavlinks }, void 0,

      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save'))))))));






  }}exports.NavlinksSettings = NavlinksSettings;












const mapStateToProps = state => {
  const { settings } = state;
  const { collection } = settings;
  const { links } = settings.navlinksData;
  return { links, collection, savingNavlinks: settings.uiState.get('savingNavlinks') };
};exports.mapStateToProps = mapStateToProps;

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ loadLinks: _navlinksActions.loadLinks, addLink: _navlinksActions.addLink, sortLink: _navlinksActions.sortLink, saveLinks: _navlinksActions.saveLinks }, dispatch);
}var _default =

(0, _reactDnd.DragDropContext)(_reactDndHtml5Backend.default)(
(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(NavlinksSettings));exports.default = _default;