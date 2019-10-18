"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.MetadataFormFields = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var _Forms = require("../../Forms");
var _reactReduxForm = require("react-redux-form");
var _t = _interopRequireDefault(require("../../I18N/t"));
var _reactRedux = require("react-redux");
var _ReactReduxForms = require("../../ReactReduxForms");












var _MultipleEditionFieldWarning = _interopRequireDefault(require("./MultipleEditionFieldWarning"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const translateOptions = thesauri => thesauri.values.map(option => {
  option.label = (0, _t.default)(thesauri._id, option.label, null, false);
  if (option.values) {
    option.options = option.values.map(val => {
      val.label = (0, _t.default)(thesauri._id, val.label, null, false);
      return val;
    });
  }
  return option;
});

class MetadataFormFields extends _react.Component {
  getField(property, _model, thesauris) {
    let thesauri;
    const { dateFormat } = this.props;
    const propertyType = property.type;
    switch (propertyType) {
      case 'select':
        thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
        return _jsx(_ReactReduxForms.Select, { model: _model, optionsValue: "id", options: translateOptions(thesauri) });
      case 'multiselect':
        thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
        return _jsx(_ReactReduxForms.MultiSelect, { model: _model, optionsValue: "id", options: translateOptions(thesauri), prefix: _model });
      case 'relationship':
        if (property.content) {
          const source = thesauris.find(opt => opt._id.toString() === property.content.toString());
          thesauri = translateOptions(source);
        }

        if (!property.content) {
          thesauri = Array.prototype.concat(...thesauris.filter(filterThesauri => filterThesauri.type === 'template').map(translateOptions));
        }
        return _jsx(_ReactReduxForms.MultiSelect, { model: _model, optionsValue: "id", options: thesauri, prefix: _model, sort: true });
      case 'date':
        return _jsx(_ReactReduxForms.DatePicker, { model: _model, format: dateFormat });
      case 'daterange':
        return _jsx(_ReactReduxForms.DateRange, { model: _model, format: dateFormat });
      case 'numeric':
        return _jsx(_ReactReduxForms.Numeric, { model: _model });
      case 'markdown':
        return _jsx(_ReactReduxForms.MarkDown, { model: _model });
      case 'nested':
        return _jsx(_ReactReduxForms.Nested, { model: _model });
      case 'multidate':
        return _jsx(_ReactReduxForms.MultiDate, { model: _model, format: dateFormat });
      case 'multidaterange':
        return _jsx(_ReactReduxForms.MultiDateRange, { model: _model, format: dateFormat });
      case 'geolocation':
        return _jsx(_ReactReduxForms.Geolocation, { model: _model });
      case 'link':
        return _jsx(_ReactReduxForms.LinkField, { model: _model });
      case 'media':
      case 'image':
        return (
          _jsx("div", {}, void 0,
          _jsx(_reactReduxForm.Field, { model: _model }, void 0, _jsx("textarea", { rows: "6", className: "form-control" })), "\xA0",
          _jsx("em", {}, void 0, "URL (address for image or media file)")));


      case 'preview':
        return _jsx("div", {}, void 0, _jsx("em", {}, void 0, "This content is automatically generated"));
      case 'text':
        return _jsx(_reactReduxForm.Field, { model: _model }, void 0, _jsx("input", { type: "text", className: "form-control" }));
      default:
        return false;}

  }

  render() {
    const { thesauris, template, multipleEdition, model } = this.props;
    const fields = template.get('properties').toJS();
    const templateID = template.get('_id');

    return (
      _jsx("div", {}, void 0,
      fields.map((property) =>
      _jsx(_Forms.FormGroup, { model: `.metadata.${property.name}` }, property.name,
      _jsx("ul", { className: "search__filter is-active" }, void 0,
      _jsx("li", {}, void 0,
      _jsx("label", {}, void 0,
      _jsx(_MultipleEditionFieldWarning.default, {
        multipleEdition: multipleEdition,
        model: model,
        field: `metadata.${property.name}` }),

      (0, _t.default)(templateID, property.label),
      property.required ? _jsx("span", { className: "required" }, void 0, "*") : '')),


      _jsx("li", { className: "wide" }, void 0, this.getField(property, `.metadata.${property.name}`, thesauris.toJS())))))));





  }}exports.MetadataFormFields = MetadataFormFields;


MetadataFormFields.defaultProps = {
  multipleEdition: false,
  dateFormat: null };










const mapStateToProps = state => ({
  dateFormat: state.settings.collection.get('dateFormat') });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(MetadataFormFields);exports.default = _default;