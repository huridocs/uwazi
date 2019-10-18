"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.Item = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Metadata = require("../Metadata");
var _prioritySortingCriteria = _interopRequireDefault(require("../utils/prioritySortingCriteria"));

var _Lists = require("./Lists");
var _DocumentLanguage = _interopRequireDefault(require("./DocumentLanguage"));
var _Icon = _interopRequireDefault(require("./Icon"));
var _Tip = _interopRequireDefault(require("./Tip"));
var _ItemSnippet = _interopRequireDefault(require("./ItemSnippet"));
var _TemplateLabel = _interopRequireDefault(require("./TemplateLabel"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Item extends _react.Component {
  getSearchSnipett(doc) {
    if (!doc.snippets || !doc.snippets.count) {
      return false;
    }
    return (
      _jsx(_ItemSnippet.default, {
        onSnippetClick: this.props.onSnippetClick,
        snippets: doc.snippets,
        doc: doc }));


  }

  render() {
    const { onClick, onMouseEnter, onMouseLeave, active, additionalIcon,
      additionalText, buttons } = this.props;

    const doc = this.props.doc.toJS();
    const Snippet = additionalText ? _jsx("div", { className: "item-snippet-wrapper" }, void 0, _jsx("div", { className: "item-snippet" }, void 0, additionalText)) : null;
    const itemClassName = `item-document ${this.props.className || ''}`;
    const itemProps = { className: itemClassName, onClick, onMouseEnter, onMouseLeave, active, tabIndex: '1' };

    return (
      _react.default.createElement(_Lists.RowList.Item, itemProps,
      this.props.itemHeader,
      _jsx("div", { className: "item-info" }, void 0,
      _jsx("div", { className: "item-name" }, void 0,
      additionalIcon || '',
      _jsx(_Icon.default, { className: "item-icon item-icon-center", data: doc.icon }),
      _jsx("span", {}, void 0, doc[this.props.titleProperty]),
      _jsx(_DocumentLanguage.default, { doc: this.props.doc })),

      Snippet,
      this.getSearchSnipett(doc)),

      _jsx("div", { className: "item-metadata" }, void 0,
      _jsx(_Metadata.FormatMetadata, {
        entity: this.props.noMetadata ? {} : doc,
        sortedProperty: this.props.search.sort,
        additionalMetadata: this.props.additionalMetadata,
        renderLabel: (prop, label) => !prop.noLabel && label })),


      _jsx(_Lists.ItemFooter, {}, void 0,
      doc.template ? _jsx(_TemplateLabel.default, { template: doc.template }) : false,
      doc.published ? '' : _jsx(_Tip.default, { icon: "eye-slash" }, void 0, "This entity is not public."),
      this.props.labels,
      buttons)));



  }}exports.Item = Item;


Item.defaultProps = {
  onClick: () => {},
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  noMetadata: false };
























Item.defaultProps = {
  search: _prioritySortingCriteria.default.get(),
  titleProperty: 'title' };


const mapStateToProps = ({ templates, thesauris }, ownProps) => {
  const search = ownProps.searchParams;
  const _templates = ownProps.templates || templates;
  return { templates: _templates, thesauris, search };
};exports.mapStateToProps = mapStateToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps)(Item);exports.default = _default;