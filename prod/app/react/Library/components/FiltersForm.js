"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FiltersForm = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireWildcard(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _UI = require("../../UI");

var _libraryActions = require("../actions/libraryActions");
var _I18N = require("../../I18N");
var _Multireducer = require("../../Multireducer");
var _debounce = _interopRequireDefault(require("../../utils/debounce"));
var _libraryFilters = _interopRequireDefault(require("../helpers/libraryFilters"));

var _FiltersFromProperties = _interopRequireDefault(require("./FiltersFromProperties"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class FiltersForm extends _react.Component {
  constructor(props) {
    super(props);
    this.search = (0, _debounce.default)(search => {
      this.props.searchDocuments({ search }, this.props.storeKey);
    }, 300);

    this.submit = this.submit.bind(this);
    this.onChange = this.onChange.bind(this);

    this.activateAutoSearch = () => {
      this.autoSearch = true;
    };
  }

  shouldComponentUpdate(nextProps) {
    return !(0, _immutable.is)(this.props.fields, nextProps.fields) ||
    !(0, _immutable.is)(this.props.aggregations, nextProps.aggregations) ||
    !(0, _immutable.is)(this.props.documentTypes, nextProps.documentTypes);
  }

  onChange(search) {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.search(search, this.props.storeKey);
    }
  }

  submit(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { templates, documentTypes } = this.props;

    const aggregations = this.props.aggregations.toJS();
    const translationContext = documentTypes.get(0);
    const allFields = this.props.fields.toJS();
    const showNoValueOnFilters = documentTypes.size;
    const fields = _libraryFilters.default.parseWithAggregations(allFields.slice(0), aggregations, showNoValueOnFilters).
    filter(field => !field.options || field.options.length);
    const model = `${this.props.storeKey}.search`;
    return (
      _jsx("div", { className: "filters-box" }, void 0,
      (() => {
        const activeTypes = templates.filter(template => documentTypes.includes(template.get('_id')));
        if (activeTypes.size > 0 && fields.length === 0) {
          return (
            _jsx("div", { className: "blank-state" }, void 0,
            _jsx(_UI.Icon, { icon: "times" }),
            _jsx("h4", {}, void 0, (0, _I18N.t)('System', 'No common filters')),
            _jsx("p", {}, void 0, "The combination of document and entity types doesn't have any filters in common."),
            _jsx("a", { href: "https://github.com/huridocs/uwazi/wiki/Filter", target: "_blank", rel: "noopener noreferrer" }, void 0, "Learn more")));


        }

        return null;
      })(),

      _jsx(_reactReduxForm.Form, { model: model, id: "filtersForm", onSubmit: this.submit, onChange: this.onChange }, void 0,
      _jsx(_FiltersFromProperties.default, {
        onChange: this.activateAutoSearch,
        properties: fields,
        translationContext: translationContext,
        storeKey: this.props.storeKey }))));




  }}exports.FiltersForm = FiltersForm;












function mapStateToProps(state, props) {
  return {
    fields: state[props.storeKey].filters.get('properties'),
    aggregations: state[props.storeKey].aggregations,
    templates: state.templates,
    documentTypes: state[props.storeKey].filters.get('documentTypes') };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ searchDocuments: _libraryActions.searchDocuments }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(FiltersForm);exports.default = _default;