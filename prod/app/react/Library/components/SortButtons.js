"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.SortButtons = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");
var _reactReduxForm = require("react-redux-form");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SortButtons extends _react.Component {
  static orderDirectionLabel(propertyType, order = 'asc') {
    let label = order === 'asc' ? 'A-Z' : 'Z-A';
    if (propertyType === 'date') {
      label = order === 'asc' ? (0, _I18N.t)('System', 'Least recently') : (0, _I18N.t)('System', 'Recently');
    }

    if (propertyType === 'numeric') {
      label = order === 'asc' ? '0-9' : '9-0';
    }

    return label;
  }

  constructor(props) {
    super(props);
    this.state = { active: false };
  }

  getAdditionalSorts(templates, search) {
    const additionalSorts = templates.toJS().reduce((sorts, template) => {
      template.properties.forEach(property => {
        const sortable = property.filter && (
        property.type === 'text' ||
        property.type === 'date' ||
        property.type === 'numeric' ||
        property.type === 'select');


        if (sortable && !sorts.find(s => s.property === property.name)) {
          const sortString = `metadata.${property.name}`;
          const sortOptions = { isActive: search.sort === sortString, search, type: property.type };

          sorts.push({
            property: property.name,
            html: this.createSortItem(sortString, sortString, template._id, property.label, sortOptions) });

        }
      });
      return sorts;
    }, []);

    return additionalSorts.map(s => s.html);
  }

  createSortItem(key, sortString, context, label, options) {
    const { isActive, search, type } = options;
    const treatAs = type === 'text' || type === 'select' ? 'string' : 'number';
    const firstOrder = treatAs !== 'number' ? 'asc' : 'desc';
    const secondOrder = treatAs !== 'number' ? 'desc' : 'asc';

    return (
      _jsx("li", {

        className: `Dropdown-option ${isActive ? 'is-active' : ''}` }, key,

      _jsx("a", {
        className: `Dropdown-option__item ${isActive && search.order === firstOrder ? 'is-active' : ''}`,
        onClick: () => this.handleClick(sortString, firstOrder, treatAs) }, void 0,

      _jsx("span", {}, void 0, (0, _I18N.t)(context, label), " (", SortButtons.orderDirectionLabel(type, firstOrder), ")"),
      _jsx(_ShowIf.default, { if: isActive && search.order === firstOrder }, void 0,
      _jsx(_UI.Icon, { icon: "caret-down" })),

      _jsx(_ShowIf.default, { if: isActive && search.order === firstOrder }, void 0,
      _jsx(_UI.Icon, { icon: "caret-up" }))),


      _jsx("a", {
        className: `Dropdown-option__item ${isActive && search.order === secondOrder ? 'is-active' : ''}`,
        onClick: () => this.handleClick(sortString, secondOrder, treatAs) }, void 0,

      _jsx("span", {}, void 0, (0, _I18N.t)(context, label), " (", SortButtons.orderDirectionLabel(type, secondOrder), ")"),
      _jsx(_ShowIf.default, { if: isActive && search.order === secondOrder }, void 0,
      _jsx(_UI.Icon, { icon: "caret-down" })),

      _jsx(_ShowIf.default, { if: isActive && search.order === secondOrder }, void 0,
      _jsx(_UI.Icon, { icon: "caret-up" })))));




  }

  changeOrder() {
    const { sort, order } = this.props.search;
    this.sort(sort, order === 'desc' ? 'asc' : 'desc');
  }

  sort(property, defaultOrder, defaultTreatAs) {
    const { search } = this.props;
    const order = defaultOrder || 'asc';
    let treatAs = defaultTreatAs;

    if (search.sort === property) {
      treatAs = search.treatAs;
    }

    const sort = { sort: property, order, treatAs };

    this.props.merge(this.props.stateProperty, sort);

    // TEST!!!
    const filters = Object.assign({}, this.props.search, sort, { userSelectedSorting: true });
    // -------
    delete filters.treatAs;

    if (this.props.sortCallback) {
      this.props.sortCallback({ search: filters }, this.props.storeKey);
    }
  }

  handleClick(property, defaultOrder, treatAs) {
    if (!this.state.active) {
      return;
    }

    this.sort(property, defaultOrder, treatAs);
  }

  toggle() {
    this.setState({ active: !this.state.active });
  }

  validateSearch() {
    const { search } = this.props;
    const _search = _objectSpread({}, search);
    if (_search.sort === '_score' && !_search.searchTerm) {
      _search.sort = 'creationDate';
      _search.order = 'desc';
    }
    return _search;
  }

  render() {
    const { templates } = this.props;
    const search = this.validateSearch();
    const order = search.order === 'asc' ? 'up' : 'down';
    const additionalSorts = this.getAdditionalSorts(templates, search, order);
    return (
      _jsx("div", { className: "sort-buttons" }, void 0,
      _jsx("div", { className: `Dropdown order-by ${this.state.active ? 'is-active' : ''}` }, void 0,
      _jsx("ul", { className: "Dropdown-list", onClick: this.toggle.bind(this) }, void 0,
      this.createSortItem('title', 'title', 'System', 'Title', { isActive: search.sort === 'title', search, type: 'string' }),
      this.createSortItem('creationDate', 'creationDate', 'System', 'Date added',
      { isActive: search.sort === 'creationDate', search, type: 'date' }),
      search.searchTerm &&
      _jsx("li", {

        className: `Dropdown-option ${search.sort === '_score' ? 'is-active' : ''}` }, "relevance",

      _jsx("a", {
        className: `Dropdown-option__item ${search.sort === '_score' ? 'is-active' : ''}`,
        onClick: () => this.handleClick('_score') }, void 0,

      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Search relevance')))),



      additionalSorts))));




  }}exports.SortButtons = SortButtons;












function mapStateToProps(state, ownProps) {
  let { templates } = state;
  const stateProperty = ownProps.stateProperty ? ownProps.stateProperty : `${ownProps.storeKey}.search`;

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = templates.filter(i => ownProps.selectedTemplates.includes(i.get('_id')));
  }

  const search = stateProperty.split(/[.,\/]/).reduce((memo, property) => Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null, state);
  return { stateProperty, search, templates };
}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ merge: _reactReduxForm.actions.merge }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SortButtons);exports.default = _default;