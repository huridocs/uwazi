"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Icon = require("../../Layout/Icon");
var _UI = require("../../UI");
var _I18N = require("../../I18N");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));

var _optionsUtils = require("../utils/optionsUtils");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const isNotAnEmptyGroup = option => !option.options || option.options.length;

class MultiSelect extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { filter: props.filter, showAll: props.showAll, ui: {} };
  }

  componentWillReceiveProps(props) {
    if (props.filter) {
      this.setState({ filter: props.filter });
    }
  }

  changeGroup(group, e) {
    const selectedItems = this.props.value.slice(0);
    if (e.target.checked) {
      group.options.forEach(_item => {
        if (!this.checked(_item)) {
          selectedItems.push(_item[this.props.optionsValue]);
        }
      });
    }

    if (!e.target.checked) {
      group.options.forEach(_item => {
        if (this.checked(_item)) {
          const index = selectedItems.indexOf(_item[this.props.optionsValue]);
          selectedItems.splice(index, 1);
        }
      });
    }
    this.props.onChange(selectedItems);
  }


  checked(option) {
    if (!this.props.value) {
      return false;
    }

    if (option.options) {
      return option.options.reduce((allIncluded, _option) => allIncluded &&
      this.props.value.includes(_option[this.props.optionsValue]), true);
    }
    return this.props.value.includes(option[this.props.optionsValue]);
  }

  anyChildChecked(parent) {
    return Boolean(parent.options && !!parent.options.find(itm => this.checked(itm)));
  }

  change(value) {
    let newValues = this.props.value ? this.props.value.slice(0) : [];
    if (newValues.includes(value)) {
      newValues = newValues.filter(val => val !== value);
      this.props.onChange(newValues);
      return;
    }

    newValues.push(value);
    this.props.onChange(newValues);
  }

  filter(e) {
    this.setState({ filter: e.target.value });
  }

  resetFilter() {
    this.setState({ filter: '' });
  }

  showAll(e) {
    e.preventDefault();
    this.setState({ showAll: !this.state.showAll });
  }

  sort(options, optionsValue, optionsLabel, isSubGroup = false) {
    const sortedOptions = options.sort((a, b) => {
      let sorting = 0;
      if (!this.state.showAll) {
        sorting = (this.checked(b) || this.anyChildChecked(b)) - (this.checked(a) || this.anyChildChecked(a));
      }

      if (sorting === 0 && typeof options[0].results !== 'undefined' && a.results !== b.results) {
        sorting = a.results > b.results ? -1 : 1;
      }

      const showingAll = this.state.showAll || options.length < this.props.optionsToShow;
      if (sorting === 0 || showingAll || this.state.sortbyLabel || isSubGroup) {
        sorting = a[optionsLabel] < b[optionsLabel] ? -1 : 1;
      }

      return sorting;
    });

    return this.moveNoValueOptionToBottom(sortedOptions);
  }

  sortOnlyAggregates(options, optionsvalue, optionsLabel) {
    if (!options.length || typeof options[0].results === 'undefined') {
      return options;
    }
    const sortedOptions = options.sort((a, b) => {
      let sorting = b.results - a.results;

      if (sorting === 0) {
        sorting = a[optionsLabel] < b[optionsLabel] ? -1 : 1;
      }

      return sorting;
    });
    return this.moveNoValueOptionToBottom(sortedOptions);
  }

  moveNoValueOptionToBottom(options) {
    let _options = [...options];
    const noValueOption = _options.find(opt => opt.noValueKey);
    if (noValueOption && !this.checked(noValueOption)) {
      _options = _options.filter(opt => !opt.noValueKey);
      _options.push(noValueOption);
    }
    return _options;
  }

  hoistCheckedOptions(options) {
    const [checkedOptions, otherOptions] = options.reduce(([checked, others], option) => {
      if (this.checked(option) || this.anyChildChecked(option)) {
        return [checked.concat([option]), others];
      }
      return [checked, others.concat([option])];
    }, [[], []]);
    let partitionedOptions = checkedOptions.concat(otherOptions);
    const noValueOption = partitionedOptions.find(opt => opt.noValueKey);
    if (noValueOption && !this.checked(noValueOption)) {
      partitionedOptions = partitionedOptions.filter(opt => !opt.noValueKey);
      partitionedOptions.push(noValueOption);
    }
    return partitionedOptions;
  }

  moreLessLabel(totalOptions) {
    if (this.state.showAll) {
      return (0, _I18N.t)('System', 'x less');
    }
    return (
      _jsx("span", {}, void 0, totalOptions.length - this.props.optionsToShow, " ", (0, _I18N.t)('System', 'x more')));

  }

  toggleOptions(group, e) {
    e.preventDefault();
    const groupKey = group[this.props.optionsValue];
    const { ui } = this.state;
    ui[groupKey] = !ui[groupKey];
    this.setState({ ui });
  }

  showSubOptions(parent) {
    const toggled = this.state.ui[parent.id];
    const parentChecked = this.checked(parent);
    const childChecked = !!parent.options.find(itm => this.checked(itm));
    return toggled || !parentChecked && childChecked;
  }

  label(option) {
    const { optionsValue, optionsLabel, prefix } = this.props;
    return (
      _jsx("label", { className: "multiselectItem-label", htmlFor: prefix + option[optionsValue] }, void 0,
      _jsx("span", { className: "multiselectItem-icon" }, void 0,
      _jsx(_UI.Icon, { icon: ['far', 'square'], className: "checkbox-empty" }),
      _jsx(_UI.Icon, { icon: "check", className: "checkbox-checked" })),

      _jsx("span", { className: "multiselectItem-name" }, void 0,
      _jsx(_Icon.Icon, { className: "item-icon", data: option.icon }),
      option[optionsLabel]),

      _jsx("span", { className: "multiselectItem-results" }, void 0,
      option.results && _jsx("span", {}, void 0, option.results),
      option.options &&
      _jsx("span", { className: "multiselectItem-action", onClick: this.toggleOptions.bind(this, option) }, void 0,
      _jsx(_UI.Icon, { icon: this.state.ui[option.id] ? 'caret-up' : 'caret-down' })))));





  }

  renderGroup(group, index) {
    const { prefix } = this.props;
    const _group = Object.assign({}, group, { results: group.results });
    return (
      _jsx("li", { className: "multiselect-group" }, index,
      _jsx("div", { className: "multiselectItem" }, void 0,
      _jsx("input", {
        type: "checkbox",
        className: "group-checkbox multiselectItem-input",
        id: prefix + group.id,
        onChange: this.changeGroup.bind(this, group),
        checked: this.checked(group) }),

      this.label(_group)),

      _jsx(_ShowIf.default, { if: this.showSubOptions(group) }, void 0,
      _jsx("ul", { className: "multiselectChild is-active" }, void 0,
      group.options.map((_item, i) => this.renderOption(_item, i, index))))));




  }

  renderOption(option, index, groupIndex = '') {
    const { optionsValue, optionsLabel, prefix } = this.props;
    const key = `${groupIndex}${index}`;
    return (
      _jsx("li", { className: "multiselectItem", title: option[optionsLabel] }, key,
      _jsx("input", {
        type: "checkbox",
        className: "multiselectItem-input",
        value: option[optionsValue],
        id: prefix + option[optionsValue],
        onChange: this.change.bind(this, option[optionsValue]),
        checked: this.checked(option) }),

      this.label(option)));


  }

  render() {
    let { optionsValue, optionsLabel } = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';

    let options = this.props.options.slice();
    const totalOptions = options.filter(option => {
      let notDefined;
      return isNotAnEmptyGroup(option) && (
      option.results === notDefined || option.results > 0 || !option.options || option.options.length || this.checked(option));
    });
    options = totalOptions;
    options = options.map(option => {
      if (option.options) {
        option.options = option.options.filter(_opt => {
          let notDefined;
          return _opt.results === notDefined || _opt.results > 0 || this.checked(_opt);
        });
      }

      return option;
    });

    if (this.state.filter) {
      options = (0, _optionsUtils.filterOptions)(this.state.filter, options, optionsLabel);
    }

    const tooManyOptions = !this.state.showAll && options.length > this.props.optionsToShow;

    if (this.props.sort) {
      options = this.sort(options, optionsValue, optionsLabel);
    } else {
      options = this.sortOnlyAggregates(options, optionsValue, optionsLabel);
    }

    if (!this.props.sort && !this.state.showAll) {
      options = this.hoistCheckedOptions(options);
    }

    if (tooManyOptions) {
      const numberOfActiveOptions = options.filter(opt => this.checked(opt)).length;
      const optionsToShow = this.props.optionsToShow > numberOfActiveOptions ? this.props.optionsToShow : numberOfActiveOptions;
      options = options.slice(0, optionsToShow);
    }

    options.forEach(option => {
      if (option.options) {
        option.options = this.sort(option.options, optionsValue, optionsLabel, true);
      }
    });

    return (
      _jsx("ul", { className: "multiselect is-active" }, void 0,
      _jsx("li", { className: "multiselectActions" }, void 0,
      _jsx(_ShowIf.default, { if: this.props.options.length > this.props.optionsToShow && !this.props.hideSearch }, void 0,
      _jsx("div", { className: "form-group" }, void 0,
      _jsx(_UI.Icon, { icon: this.state.filter ? 'times-circle' : 'search', onClick: this.resetFilter.bind(this) }),
      _jsx("input", {
        className: "form-control",
        type: "text",
        placeholder: (0, _I18N.t)('System', 'Search item', null, false),
        value: this.state.filter,
        onChange: this.filter.bind(this) })))),




      !options.length && _jsx("span", {}, void 0, (0, _I18N.t)('System', 'No options found')),
      options.map((option, index) => {
        if (option.options) {
          return this.renderGroup(option, index);
        }

        return this.renderOption(option, index);
      }),

      _jsx("li", { className: "multiselectActions" }, void 0,
      _jsx(_ShowIf.default, { if: totalOptions.length > this.props.optionsToShow && !this.props.showAll }, void 0,
      _jsx("button", { onClick: this.showAll.bind(this), className: "btn btn-xs btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: this.state.showAll ? 'caret-up' : 'caret-down' }),
      _jsx("i", { className: this.state.showAll ? 'fa fa-caret-up' : 'fa fa-caret-down' }),
      this.moreLessLabel(totalOptions))))));





  }}exports.default = MultiSelect;


MultiSelect.defaultProps = {
  optionsLabel: 'label',
  optionsValue: 'value',
  value: [],
  prefix: '',
  options: [],
  filter: '',
  optionsToShow: 5,
  showAll: false,
  hideSearch: false,
  sort: false,
  sortbyLabel: false };