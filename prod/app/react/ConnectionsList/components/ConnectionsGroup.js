"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapDispatchToProps = exports.mapStateToProps = exports.ConnectionsGroup = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _immutable = require("immutable");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _I18N = require("../../I18N");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ConnectionsGroup extends _react.Component {
  toggleExpandGroup() {
    this.setState({ expanded: !this.state.expanded });
  }

  toggleSelectGroup() {
    const { group } = this.props;
    const selectedItems = !this.state.selected ? group.get('templates').map(i => group.get('key') + i.get('_id')) : (0, _immutable.fromJS)([]);

    this.setGroupFilter(selectedItems);
    this.setState({ selected: !this.state.selected, selectedItems });
  }

  toggleSelectItem(item) {
    let selectedItems;
    let groupSelected;

    if (this.state.selectedItems.includes(item)) {
      groupSelected = false;
      selectedItems = this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
    }

    if (!this.state.selectedItems.includes(item)) {
      selectedItems = this.state.selectedItems.push(item);
      groupSelected = selectedItems.size === this.props.group.get('templates').size;
    }

    this.setGroupFilter(selectedItems);
    this.setState({ selectedItems, selected: groupSelected });
  }

  setGroupFilter(selectedItems) {
    const newFilter = {};
    newFilter[this.props.group.get('key')] = selectedItems;
    this.props.setFilter(newFilter);
  }

  componentWillMount() {
    this.setState({ expanded: true, selected: false, selectedItems: (0, _immutable.fromJS)([]) });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(0, _immutable.is)(this.props.group, nextProps.group) ||
    this.state.expanded !== nextState.expanded ||
    this.state.selected !== nextState.selected ||
    this.state.selectedItems.size !== nextState.selectedItems.size;
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.filters.size) {
      this.setState({ selected: false, selectedItems: (0, _immutable.fromJS)([]) });
    }

    if (nextProps.group.get('templates').size > this.props.group.get('templates').size) {
      this.setState({ selected: false });
    }
  }

  render() {
    const group = this.props.group.toJS();
    const { connectionLabel, templates } = group;

    return (
      _jsx("li", {}, void 0,
      _jsx("div", { className: "multiselectItem" }, void 0,
      _jsx("input", {
        type: "checkbox",
        className: "form-control multiselectItem-input",
        id: `group${group.key}`,
        onChange: this.toggleSelectGroup.bind(this),
        checked: this.state.selected }),

      _jsx("label", { htmlFor: `group${group.key}`, className: "multiselectItem-label" }, void 0,
      _jsx("span", { className: "multiselectItem-icon" }, void 0,
      _jsx(_UI.Icon, { icon: ['far', 'square'], className: "checkbox-empty" }),
      _jsx(_UI.Icon, { icon: "check", className: "checkbox-checked" })),

      _jsx("span", { className: "multiselectItem-name" }, void 0,
      _jsx("b", {}, void 0, group.key ?
      (0, _I18N.t)(group.context, connectionLabel) : (0, _I18N.t)('System', 'No Label')))),



      _jsx("span", { className: "multiselectItem-results" }, void 0,
      _jsx("span", {}, void 0, group.templates.reduce((size, i) => size + i.count, 0)),
      _jsx("span", { className: "multiselectItem-action", onClick: this.toggleExpandGroup.bind(this) }, void 0,
      _jsx(_UI.Icon, { icon: this.state.expanded ? 'caret-up' : 'caret-down' })))),



      _jsx(_ShowIf.default, { if: this.state.expanded }, void 0,
      _jsx("ul", { className: "multiselectChild is-active" }, void 0,
      templates.map((template, index) =>
      _jsx("li", { className: "multiselectItem", title: template.label }, index,
      _jsx("input", {
        type: "checkbox",
        className: "multiselectItem-input",
        id: group.key + template._id,
        onChange: this.toggleSelectItem.bind(this, group.key + template._id),
        checked: this.state.selectedItems.includes(group.key + template._id) }),

      _jsx("label", {
        className: "multiselectItem-label",
        htmlFor: group.key + template._id }, void 0,

      _jsx("span", { className: "multiselectItem-icon" }, void 0,
      _jsx(_UI.Icon, { icon: ['far', 'square'], className: "checkbox-empty" }),
      _jsx(_UI.Icon, { icon: "check", className: "checkbox-checked" })),

      _jsx("span", { className: "multiselectItem-name" }, void 0, (0, _I18N.t)(template._id, template.label))),

      _jsx("span", { className: "multiselectItem-results" }, void 0,
      template.count)))))));







  }}exports.ConnectionsGroup = ConnectionsGroup;








const mapStateToProps = ({ relationships }) => ({ filters: relationships.list.filters });exports.mapStateToProps = mapStateToProps;

const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)({
  setFilter: _actions.setFilter },
dispatch);exports.mapDispatchToProps = mapDispatchToProps;var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ConnectionsGroup);exports.default = _default;