"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.DocumentTypesList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");
var _reactRedux = require("react-redux");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _immutable = require("immutable");
var _I18N = require("../../I18N");
var _UI = require("../../UI");

var _filterActions = require("../actions/filterActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class DocumentTypesList extends _react.Component {
  constructor(props) {
    super(props);
    let items = this.props.settings.collection.toJS().filters || [];
    if (!items.length || this.props.storeKey === 'uploads') {
      items = props.templates.toJS().map(tpl => ({ id: tpl._id, name: tpl.name }));
    }

    if (this.props.storeKey === 'uploads') {
      items.unshift({ id: 'missing', name: 'No type' });
    }
    this.state = {
      items,
      ui: {} };

  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(0, _immutable.is)(this.props.libraryFilters, nextProps.libraryFilters) ||
    !(0, _immutable.is)(this.props.settings, nextProps.settings) ||
    !(0, _immutable.is)(this.props.aggregations, nextProps.aggregations) ||
    this.stateChanged(nextState);
  }

  changeAll(item, e) {
    const selectedItems = this.props.libraryFilters.toJS().documentTypes || [];
    if (e.target.checked) {
      item.items.forEach(_item => {
        if (!this.checked(_item)) {
          selectedItems.push(_item.id);
        }
      });
    }

    if (!e.target.checked) {
      item.items.forEach(_item => {
        if (this.checked(_item)) {
          const index = selectedItems.indexOf(_item.id);
          selectedItems.splice(index, 1);
        }
      });
    }

    this.setState({ selectedItems });
    this.props.filterDocumentTypes(selectedItems, this.props.storeKey);
  }

  change(item) {
    const selectedItems = this.props.libraryFilters.toJS().documentTypes || [];

    if (selectedItems.includes(item.id)) {
      const index = selectedItems.indexOf(item.id);
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item.id);
    }

    this.setState({ selectedItems });
    this.props.filterDocumentTypes(selectedItems, this.props.storeKey);
  }

  toggleOptions(item, e) {
    e.preventDefault();
    if (!this.checked(item) && item.items.find(itm => this.checked(itm))) {
      return;
    }
    const { ui } = this.state;
    ui[item.id] = !ui[item.id];
    this.setState({ ui });
  }

  aggregations(item) {
    const aggregations = this.aggs;
    const buckets = aggregations.all && aggregations.all._types ? aggregations.all._types.buckets : [];
    const found = buckets.find(agg => agg.key === item.id);
    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => result + this.aggregations(_item), 0);
    }

    return 0;
  }

  showSubOptions(parent) {
    const toggled = this.state.ui[parent.id];
    return !!(toggled || !!(!this.checked(parent) && parent.items.find(itm => this.checked(itm))));
  }

  checked(item) {
    if (item.items) {
      return item.items.reduce((result, _item) => result && this.checked(_item), item.items.length > 0);
    }

    return this.props.libraryFilters.toJS().documentTypes.includes(item.id);
  }

  stateChanged(nextState) {
    return Object.keys(nextState.ui).length === Object.keys(this.state.ui).length ||
    Object.keys(nextState.ui).reduce((result, key) => result || nextState.ui[key] === this.state.ui[key], false);
  }

  renderSingleType(item, index) {
    const context = item.id === 'missing' ? 'System' : item.id;
    return (
      _jsx("li", { className: "multiselectItem", title: item.name }, index,
      _jsx("input", {
        type: "checkbox",
        className: "multiselectItem-input",
        value: item.id,
        id: item.id,
        onChange: this.change.bind(this, item),
        checked: this.checked(item) }),

      _jsx("label", {
        className: "multiselectItem-label",
        htmlFor: item.id }, void 0,

      _jsx("span", { className: "multiselectItem-icon" }, void 0,
      _jsx(_UI.Icon, { icon: ['far', 'square'], className: "checkbox-empty" }),
      _jsx(_UI.Icon, { icon: "check", className: "checkbox-checked" })),

      _jsx("span", { className: "multiselectItem-name" }, void 0, _jsx(_I18N.Translate, { context: context }, void 0, item.name))),

      _jsx("span", { className: "multiselectItem-results" }, void 0,
      this.aggregations(item))));



  }

  renderGroupType(item, index) {
    return (
      _jsx("li", {}, index,
      _jsx("div", { className: "multiselectItem" }, void 0,
      _jsx("input", {
        type: "checkbox",
        className: "form-control multiselectItem-input",
        id: item.id,
        onChange: this.changeAll.bind(this, item),
        checked: this.checked(item) }),

      _jsx("label", { htmlFor: item.id, className: "multiselectItem-label" }, void 0,
      _jsx("span", { className: "multiselectItem-icon" }, void 0,
      _jsx(_UI.Icon, { icon: ['far', 'square'], className: "checkbox-empty" }),
      _jsx(_UI.Icon, { icon: "check", className: "checkbox-checked" })),

      _jsx("span", { className: "multiselectItem-name" }, void 0, _jsx("b", {}, void 0, (0, _I18N.t)('Filters', item.name)))),

      _jsx("span", { className: "multiselectItem-results" }, void 0,
      _jsx("span", {}, void 0, this.aggregations(item)),
      _jsx("span", { className: "multiselectItem-action", onClick: this.toggleOptions.bind(this, item) }, void 0,
      _jsx(_UI.Icon, { icon: this.state.ui[item.id] ? 'caret-up' : 'caret-down' })))),



      _jsx(_ShowIf.default, { if: this.showSubOptions(item) }, void 0,
      _jsx("ul", { className: "multiselectChild is-active" }, void 0,
      item.items.map((_item, i) => this.renderSingleType(_item, i))))));




  }

  render() {
    this.aggs = this.props.aggregations.toJS();
    return (
      _jsx("ul", { className: "multiselect is-active" }, void 0,
      this.state.items.map((item, index) => {
        if (item.items) {
          return this.renderGroupType(item, index);
        }
        return this.renderSingleType(item, index);
      })));


  }}exports.DocumentTypesList = DocumentTypesList;











function mapStateToProps(state, props) {
  return {
    libraryFilters: state[props.storeKey].filters,
    settings: state.settings,
    templates: state.templates,
    aggregations: state[props.storeKey].aggregations };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ filterDocumentTypes: _filterActions.filterDocumentTypes }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(DocumentTypesList);exports.default = _default;