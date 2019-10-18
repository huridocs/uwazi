"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var libraryFilters = _interopRequireWildcard(require("../../../Library/helpers/libraryFilters"));
var _colorScheme = _interopRequireDefault(require("../colorScheme"));
var _arrayUtils = _interopRequireDefault(require("../arrayUtils"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const { sortValues, formatPayload, formatDataForChart } = _arrayUtils.default;

describe('Array Utils', () => {
  describe('sortValues', () => {
    it('should sort the passed values, ordering similar results by label', () => {
      const unsortedValues = [
      { label: 'b', results: 2 },
      { label: 'z', results: 3 },
      { label: 'z', results: 2 },
      { label: 'A', results: 2 }];


      expect(sortValues(unsortedValues)[0]).toEqual({ label: 'z', results: 3 });
      expect(sortValues(unsortedValues)[1]).toEqual({ label: 'A', results: 2 });
      expect(sortValues(unsortedValues)[2]).toEqual({ label: 'b', results: 2 });
      expect(sortValues(unsortedValues)[3]).toEqual({ label: 'z', results: 2 });
    });
  });

  describe('formatPayload', () => {
    function testPayload(data, index) {
      expect(formatPayload(data)[index]).toEqual({
        color: _colorScheme.default[index % _colorScheme.default.length],
        formatter: jasmine.any(Function),
        type: 'rect',
        value: data[index].name });


      expect(formatPayload(data)[index].formatter()).toEqual(_jsx("span", { style: { color: '#333' } }, void 0, data[index].name));
    }

    it('should map the values assigning color scheme colors', () => {
      const data = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
      testPayload(data, 0);
      testPayload(data, 3);
    });
  });

  describe('formatDataForChart', () => {
    let data;
    let property;
    let thesauri;
    let options;

    beforeEach(() => {
      data = _immutable.default.fromJS([
      { key: 'id1', doc_count: 10, filtered: { doc_count: 3 } },
      { key: 'id2', doc_count: 20, filtered: { doc_count: 5 } },
      { key: 'id3', doc_count: 5, filtered: { doc_count: 4 } }]);

      property = 'prop';
      thesauri = _immutable.default.fromJS([
      {
        name: 'Thes',
        values: [{ label: 'Val 1', id: 'id1' }, { label: 'Val 2', id: 'id2' }, { label: 'Val 3', id: 'id3' }] }]);


      options = {
        context: 'contextId',
        excludeZero: false,
        maxCategories: 0,
        aggregateOthers: 'false' };

      jest.spyOn(libraryFilters, 'populateOptions').mockReturnValue([{
        content: 'contextId',
        options: [
        { label: 'Val 1', id: 'id1' },
        { label: 'Val 2', id: 'id2' },
        { label: 'Val 3', id: 'id3' }] }]);


    });

    it('should aggregate filtered results for each category sorted in descending order', () => {
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([
      { label: 'Val 2', id: 'id2', results: 5 },
      { label: 'Val 3', id: 'id3', results: 4 },
      { label: 'Val 1', id: 'id1', results: 3 }]);

      expect(libraryFilters.populateOptions).toHaveBeenCalledWith([{ content: options.context }], thesauri.toJS());
    });

    it('should omit results without labels', () => {
      data = data.push(_immutable.default.fromJS({ key: 'id4', doc_count: 5, filtered: { doc_count: 1 } }));
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([
      { label: 'Val 2', id: 'id2', results: 5 },
      { label: 'Val 3', id: 'id3', results: 4 },
      { label: 'Val 1', id: 'id1', results: 3 }]);

    });

    it('should return an empty array if no labels are found for the given context', () => {
      jest.spyOn(libraryFilters, 'populateOptions').mockReturnValue([{ content: 'contextId', options: null }]);
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([]);
    });
  });
});