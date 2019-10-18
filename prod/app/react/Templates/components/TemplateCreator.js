"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.TemplateCreator = void 0;require("../scss/templates.scss");

var _reactDnd = require("react-dnd");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactDndHtml5Backend = _interopRequireDefault(require("react-dnd-html5-backend"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _templateActions = require("../actions/templateActions");
var _relationTypeActions = require("../../RelationTypes/actions/relationTypeActions");
var _MetadataTemplate = _interopRequireDefault(require("./MetadataTemplate"));
var _PropertyOption = _interopRequireDefault(require("./PropertyOption"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TemplateCreator extends _react.Component {
  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    let save = this.props.saveTemplate;
    let backUrl = '/settings/templates';
    let environment = 'document';

    if (this.props.relationType) {
      save = this.props.saveRelationType;
      backUrl = '/settings/connections';
      environment = 'relationship';
    }

    return (
      _jsx("div", { className: "metadata" }, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, "Metadata creator"),


      _jsx("div", { className: "panel-body" }, void 0,
      _jsx("div", { className: "row" }, void 0,
      _jsx("main", { className: "col-xs-12 col-sm-9" }, void 0,
      _jsx(_MetadataTemplate.default, { saveTemplate: save, backUrl: backUrl, relationType: this.props.relationType })),

      environment !== 'relationship' &&
      _jsx("aside", { className: "col-xs-12 col-sm-3" }, void 0,
      _jsx("div", { className: "metadataTemplate-constructor" }, void 0,
      _jsx("div", {}, void 0, _jsx("i", {}, void 0, "Properties")),
      _jsx("ul", { className: "list-group property-options-list" }, void 0,
      _jsx(_PropertyOption.default, { label: "Text", type: "text" }),
      _jsx(_PropertyOption.default, { label: "Numeric", type: "numeric" }),
      _jsx(_PropertyOption.default, { label: "Select", type: "select", disabled: this.props.noDictionaries }),
      _jsx(_PropertyOption.default, { label: "Multi Select", type: "multiselect", disabled: this.props.noDictionaries }),
      environment !== 'relationship' &&
      _jsx(_PropertyOption.default, { label: "Relationship", type: "relationship", disabled: this.props.noRelationtypes }),







      _jsx(_PropertyOption.default, { label: "Date", type: "date" }),
      _jsx(_PropertyOption.default, { label: "Date Range", type: "daterange" }),
      _jsx(_PropertyOption.default, { label: "Multi Date", type: "multidate" }),
      _jsx(_PropertyOption.default, { label: "Multi Date Range", type: "multidaterange" }),
      _jsx(_PropertyOption.default, { label: "Rich Text", type: "markdown" }),
      _jsx(_PropertyOption.default, { label: "Link", type: "link" }),
      _jsx(_PropertyOption.default, { label: "Image", type: "image" }),
      environment === 'document' && _jsx(_PropertyOption.default, { label: "Preview", type: "preview" }),
      _jsx(_PropertyOption.default, { label: "Media", type: "media" }),
      _jsx(_PropertyOption.default, { label: "Geolocation", type: "geolocation" }),
      this.props.project === 'cejil' &&
      _jsx(_PropertyOption.default, { label: "Violated articles", type: "nested" })),


      this.props.noRelationtypes &&
      _jsx("div", { className: "alert alert-warning" }, void 0, "Relationship fields can not be added untill you have at least one relationship type to select."))))))));











  }}exports.TemplateCreator = TemplateCreator;


TemplateCreator.defaultProps = {
  relationType: false,
  noRelationtypes: true,
  noDictionaries: true,
  project: '' };












TemplateCreator.contextTypes = {
  router: _propTypes.default.object };


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ resetTemplate: _templateActions.resetTemplate, saveTemplate: _templateActions.saveTemplate, saveRelationType: _relationTypeActions.saveRelationType }, dispatch);
}

const mapStateToProps = ({ settings, relationTypes, thesauris }) => ({
  project: settings.collection.toJS().project,
  noRelationtypes: !relationTypes.size,
  noDictionaries: !thesauris.size });var _default =


(0, _reactDnd.DragDropContext)(_reactDndHtml5Backend.default)(
(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(TemplateCreator));exports.default = _default;