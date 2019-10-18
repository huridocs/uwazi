"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.LibraryCharts = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");

var _libraryFilters = require("../../Library/helpers/libraryFilters");

var _LibraryChart = _interopRequireDefault(require("./LibraryChart"));
var _arrayUtils = _interopRequireDefault(require("../utils/arrayUtils"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function translateOptions(_property) {
  const property = _property;
  property.options = property.options.map(_option => {
    const option = _option;
    option.label = (0, _I18N.t)(property.content, option.label, null, false);
    return option;
  });
  return property;
}

function sortFields(_field) {
  const field = _field;
  field.options = _arrayUtils.default.sortValues(field.options);
  return field;
}

class LibraryCharts extends _react.Component {
  itemResults(item) {
    const { aggregations } = this;
    const buckets = aggregations.all && aggregations.all.types ? aggregations.all.types.buckets : [];
    const found = buckets.find(agg => agg.key === item.id);

    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => result + this.itemResults(_item), 0);
    }

    return 0;
  }

  conformDocumentTypesToFields() {
    let items = this.props.collection.toJS().filters || [];

    if (!items.length || this.props.storeKey === 'uploads') {
      items = this.props.templates.toJS().map(tpl => ({ id: tpl._id, name: tpl.name }));
    }

    if (this.props.storeKey === 'uploads') {
      items.unshift({ id: 'missing', name: (0, _I18N.t)('System', 'No type') });
    }

    const fields = [{
      options: items.map(item => ({ label: (0, _I18N.t)(item.id, item.name), results: this.itemResults(item) })),
      label: (0, _I18N.t)('System', 'Document and entity types') }];


    return fields;
  }

  render() {
    let fields = [];

    if (this.props.aggregations) {
      this.aggregations = this.props.aggregations.toJS();

      if (this.props.fields.size) {
        fields = (0, _libraryFilters.parseWithAggregations)(this.props.fields.toJS(), this.aggregations).
        filter(field => (field.type === 'select' || field.type === 'multiselect') && field.options.length).
        map(translateOptions).
        map(sortFields);
      }

      fields = fields.length ? fields : this.conformDocumentTypesToFields();
    }

    return (
      _jsx("div", { className: "documents-list" }, void 0,
      _jsx("div", { className: "main-wrapper" }, void 0,
      _jsx("div", { className: "item-group item-group-charts" }, void 0,
      fields.map((field, index) =>
      _jsx(_LibraryChart.default, {

        options: field.options,
        label: (0, _I18N.t)(this.props.translationContext, field.label) }, index))))));






  }}exports.LibraryCharts = LibraryCharts;











function mapStateToProps(state, props) {
  const documentTypesExist = props.storeKey && state[props.storeKey].filters.get('documentTypes');

  return {
    aggregations: props.storeKey ? state[props.storeKey].aggregations : null,
    fields: props.storeKey ? state[props.storeKey].filters.get('properties') : null,
    collection: state.settings.collection,
    templates: state.templates,
    translationContext: documentTypesExist ? state[props.storeKey].filters.getIn(['documentTypes', 0]) : null };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(LibraryCharts);exports.default = _default;