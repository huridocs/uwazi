"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _I18N = require("../../I18N");
var _libraryFilters = require("../../Library/helpers/libraryFilters");

var _colorScheme = _interopRequireDefault(require("./colorScheme"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function sortValues(values) {
  values.sort((a, b) => {
    if (a.others || b.others) {
      return false;
    }

    if (a.results === b.results) {
      return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
    }

    return b.results - a.results;
  });

  return values;
}

function formatPayload(data) {
  return data.map((item, index) => ({
    value: item.name,
    type: 'rect',
    color: _colorScheme.default[index % _colorScheme.default.length],
    formatter: () => _jsx("span", { style: { color: '#333' } }, void 0, item.name) }));

}

const formatDataForChart = (data, property, thesauris, { context, excludeZero, maxCategories, aggregateOthers = false }) => {
  const res = (0, _libraryFilters.populateOptions)([{ content: context }], thesauris.toJS());
  const { options } = res[0];

  let relevant = data.toJS().filter(i => i.key !== 'missing');

  if (excludeZero) {
    relevant = relevant.filter(i => i.filtered.doc_count !== 0);
  }

  let categories = relevant.sort((a, b) => b.filtered.doc_count - a.filtered.doc_count);

  if (Number(maxCategories)) {
    categories = relevant.slice(0, Number(maxCategories));
    categories[categories.length] = relevant.slice(Number(maxCategories)).
    reduce((memo, category) => {
      // eslint-disable-next-line
      memo.filtered.doc_count += category.filtered.doc_count;
      return memo;
    }, { others: aggregateOthers, key: 'others', filtered: { doc_count: 0 } });
  }

  return categories.map(item => {
    if (item.others && item.filtered.doc_count) {
      return { others: true, id: item.key, label: 'others', results: item.filtered.doc_count };
    }

    const label = options && options.find(o => o.id === item.key);
    if (!label) {
      return null;
    }

    return { id: item.key, label: (0, _I18N.t)(context, label.label, null, false), results: item.filtered.doc_count };
  }).
  filter(i => !!i);
};var _default =

{
  sortValues,
  formatPayload,
  formatDataForChart };exports.default = _default;