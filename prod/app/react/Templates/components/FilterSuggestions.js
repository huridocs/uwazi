"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FilterSuggestions = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Icons = _interopRequireDefault(require("./Icons"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FilterSuggestions extends _react.Component {
  static getTypeIcon(type) {
    return _Icons.default[type] || 'fa fa-font';
  }

  getThesauriName(thesauriId) {
    const _thesauri = this.props.thesauris.toJS().find(thesauri => thesauri._id === thesauriId) || {};

    return _thesauri.name;
  }

  findSameLabelProperties(label, templates) {
    return templates.
    filter(template => template._id !== this.props.data._id).
    map(template => {
      const property = template.properties.find(prop => prop.label.trim().toLowerCase() === label.trim().toLowerCase() && prop.filter);

      if (property) {
        return { template: template.name, property };
      }
    }).
    filter(match => match);
  }

  filterSuggestions(label, type, content, hasThesauri) {
    return this.findSameLabelProperties(label, this.props.templates.toJS()).
    map((propertyMatch, index) => {
      const typeConflict = propertyMatch.property.type !== type;
      const contentConflict = propertyMatch.property.content !== content;
      return this.renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index);
    });
  }

  renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index) {
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    let title = 'This property has the same configuration and will be used together.';
    if (contentConflict) {
      title = 'This property has different Thesauri and wont\'t be used together.';
    }

    if (typeConflict) {
      title = 'This property has different Type and wont\'t be used together.';
    }
    const icon = FilterSuggestions.getTypeIcon(propertyMatch.property.type);
    const type = propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);

    return (
      _jsx("tr", { className: activeClass, title: title }, index,
      _jsx("td", {}, void 0, _jsx("i", { className: "fa fa-file-o" }), " ", propertyMatch.template),
      _jsx("td", { className: typeConflict ? 'conflict' : '' }, void 0,
      _jsx("i", { className: "fa fa-warning" }),
      _jsx("i", { className: icon }), " ", type),

      (() => {
        if (hasThesauri && propertyMatch.property.content) {
          const thesauri = this.getThesauriName(propertyMatch.property.content);
          return (
            _jsx("td", { className: contentConflict ? 'conflict' : '' }, void 0,
            _jsx("i", { className: "fa fa-warning" }),
            _jsx("i", { className: "fa fa-book" }), " ", thesauri));


        }
        return false;
      })()));


  }

  render() {
    const { label } = this.props;
    const { type } = this.props;
    const { content } = this.props;
    const hasThesauri = typeof content !== 'undefined';
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    const title = 'This is the current property and will be used togheter with equal properties.';
    const icon = FilterSuggestions.getTypeIcon(type);


    return (
      _jsx("table", { className: "table" }, void 0,
      _jsx("thead", {}, void 0,
      _jsx("tr", {}, void 0,
      _jsx("th", {}, void 0, "Document or entity"),
      _jsx("th", {}, void 0, "Type"),
      (() => {
        if (hasThesauri) {
          return _jsx("th", {}, void 0, "Thesauri");
        }
      })())),


      _jsx("tbody", {}, void 0,
      _jsx("tr", { className: activeClass, title: title }, void 0,
      _jsx("td", {}, void 0, _jsx("i", { className: "fa fa-file-o" }), " ", this.props.data.name),
      _jsx("td", {}, void 0, _jsx("i", { className: icon }), " ", type[0].toUpperCase() + type.slice(1)),
      (() => {
        if (hasThesauri) {
          const thesauri = this.getThesauriName(content);
          return _jsx("td", {}, void 0, _jsx("i", { className: "fa fa-book" }), " ", thesauri);
        }
      })()),

      this.filterSuggestions(label, type, content, hasThesauri))));



  }}exports.FilterSuggestions = FilterSuggestions;












function mapStateToProps(state) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    data: state.template.data };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FilterSuggestions);exports.default = _default;