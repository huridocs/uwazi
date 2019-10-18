"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.FiltersForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = require("immutable");

var _RequestParams = require("../../utils/RequestParams");
var _DragAndDrop = require("../../Layout/DragAndDrop");
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));
var _BasicReducer = require("../../BasicReducer");
var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));
var _notificationsActions = require("../../Notifications/actions/notificationsActions");
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const removeItem = itemId => {
  const removeItemIterator = items => items.
  filter(item => item.id !== itemId).
  map(_item => {
    const item = _objectSpread({}, _item);
    if (item.items) {
      item.items = removeItemIterator(item.items);
    }
    return item;
  });

  return removeItemIterator;
};

class FiltersForm extends _react.Component {
  constructor(props) {
    super(props);
    const activeFilters = props.settings.collection.toJS().filters || [];
    const inactiveFilters = props.templates.toJS().filter(tpl => !activeFilters.find(filt => {
      const matchId = filt.id === tpl._id;
      let insideGroup = false;
      if (filt.items) {
        insideGroup = filt.items.find(_filt => _filt.id === tpl._id);
      }

      return matchId || insideGroup;
    })).map(tpl => ({ id: tpl._id, name: tpl.name }));

    this.state = { activeFilters, inactiveFilters };
    this.activesChange = this.activesChange.bind(this);
    this.unactivesChange = this.unactivesChange.bind(this);
    this.renderActiveItems = this.renderActiveItems.bind(this);
    this.renderInactiveItems = this.renderInactiveItems.bind(this);
  }

  activesChange(items) {
    items.forEach(item => {
      if (!item.items) {
        return;
      }
      // eslint-disable-next-line
      item.items = item.items.filter(subitem => {
        if (subitem.items) {
          items.push(subitem);
          return false;
        }
        return true;
      });
    });
    this.setState({ activeFilters: items });
  }

  unactivesChange(items) {
    this.setState({ inactiveFilters: items });
  }

  sanitizeFilterForSave(_filter) {
    const filter = _objectSpread({}, _filter);
    delete filter.container;
    delete filter.index;
    if (filter.items) {
      filter.items = filter.items.map(item => this.sanitizeFilterForSave(item));
    }

    return filter;
  }

  save() {
    const { activeFilters } = this.state;
    const { settings: propSettings, notify, setSettings } = this.props;

    const settings = propSettings.collection.toJS();
    const filters = activeFilters.map(filter => this.sanitizeFilterForSave(filter));
    settings.filters = filters;
    _SettingsAPI.default.save(new _RequestParams.RequestParams(settings)).
    then(result => {
      notify((0, _I18N.t)('System', 'Settings updated', null, false), 'success');
      setSettings(Object.assign(settings, result));
    });
  }

  addGroup() {
    const { activeFilters } = this.state;
    const newGroup = { id: (0, _uniqueID.default)(), name: 'New group', items: [] };
    this.setState({ activeFilters: activeFilters.concat([newGroup]) });
  }

  removeGroup(group) {
    const { activeFilters: activeFiltersState } = this.state;
    const activeFilters = activeFiltersState.filter(item => item.id !== group.id);
    this.setState({ activeFilters });
  }

  removeItem(item) {
    const { activeFilters: activeFiltersState, inactiveFilters } = this.state;
    const activeFilters = removeItem(item.id)(activeFiltersState);
    this.setState({ activeFilters, inactiveFilters: inactiveFilters.concat([item]) });
  }

  renderGroup(group) {
    const onChange = items => {
      group.items = items;
      this.setState(this.state);
    };

    const nameChange = e => {
      const name = e.target.value;
      group.name = name;
      this.setState(this.state);
    };

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: "input-group" }, void 0,
      _jsx("input", { type: "text", className: "form-control", value: group.name, onChange: nameChange.bind(this) }),
      _jsx("span", { className: "input-group-btn" }, void 0,
      _jsx("button", { type: "button", className: "btn btn-danger", onClick: this.removeGroup.bind(this, group), disabled: group.items.length }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" })))),



      _jsx(_DragAndDrop.DragAndDropContainer, { id: group.id, onChange: onChange.bind(this), renderItem: this.renderActiveItems, items: group.items })));


  }

  renderActiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return (
      _jsx("div", {}, void 0,
      _jsx("span", {}, void 0, item.name),
      _jsx("button", { type: "button", className: "btn btn-xs btn-danger", onClick: this.removeItem.bind(this, item) }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }))));



  }

  renderInactiveItems(item) {
    if (item.items) {
      return this.renderGroup(item);
    }
    return _jsx("div", {}, void 0, _jsx("span", {}, void 0, item.name));
  }

  render() {
    const { activeFilters, inactiveFilters } = this.state;
    return (
      _jsx("div", { className: "FiltersForm" }, void 0,
      _jsx("div", { className: "FiltersForm-list" }, void 0,
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0,
      (0, _I18N.t)('System', 'Filters configuration')),

      _jsx("div", { className: "panel-body" }, void 0,
      _jsx("div", { className: "row" }, void 0,
      _jsx("div", { className: "col-sm-9" }, void 0,
      _jsx("div", { className: "alert alert-info" }, void 0,
      _jsx(_UI.Icon, { icon: "info-circle", size: "2x" }),
      _jsx("div", { className: "force-ltr" }, void 0,
      _jsx("p", {}, void 0, "By default, users can filter the documents or entities in the library based on the types of documents/entities you have defined. However, you can configure how these document/entity types will be displayed:"),




      _jsx("ul", {}, void 0,
      _jsx("li", {}, void 0, "drag and drop each document/entity type into the window in order to configure their order"),
      _jsx("li", {}, void 0, "select &quote;Create group&quote; below to group filters under a label (e.g. &quote;Documents&quote; or &quote;People&quote;)")))),






      _jsx(_DragAndDrop.DragAndDropContainer, {
        id: "active",
        onChange: this.activesChange,
        renderItem: this.renderActiveItems,
        items: activeFilters })),


      _jsx("div", { className: "col-sm-3" }, void 0,
      _jsx("div", { className: "FiltersForm-constructor" }, void 0,
      _jsx("div", {}, void 0, _jsx("i", {}, void 0, (0, _I18N.t)('System', 'Document and entity types'))),
      _jsx(_DragAndDrop.DragAndDropContainer, {
        id: "inactive",
        onChange: this.unactivesChange,
        renderItem: this.renderInactiveItems,
        items: inactiveFilters }))))))),







      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx("button", { type: "button", onClick: this.addGroup.bind(this), className: "btn btn-sm btn-primary" }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Create group'))),

      _jsx("button", { type: "button", onClick: this.save.bind(this), className: "btn btn-sm btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save'))))));




  }}exports.FiltersForm = FiltersForm;









const mapStateToProps = state => ({
  templates: state.templates,
  settings: state.settings });


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ setSettings: _BasicReducer.actions.set.bind(null, 'settings/collection'), notify: _notificationsActions.notify }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(FiltersForm);exports.default = _default;