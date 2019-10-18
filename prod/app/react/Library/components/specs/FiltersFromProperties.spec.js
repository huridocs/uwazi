"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _FiltersFromProperties = require("../FiltersFromProperties");
var _DateFilter = _interopRequireDefault(require("../DateFilter"));
var _NestedFilter = _interopRequireDefault(require("../NestedFilter"));
var _NumberRangeFilter = _interopRequireDefault(require("../NumberRangeFilter"));
var _SelectFilter = _interopRequireDefault(require("../SelectFilter"));
var _TextFilter = _interopRequireDefault(require("../TextFilter"));
var _RelationshipFilter = _interopRequireDefault(require("../RelationshipFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FiltersFromProperties', () => {
  let props = {};

  beforeEach(() => {
    const state = {
      settings: { collection: _immutable.default.fromJS({ dateFormat: 'dateFormat' }) },
      library: { aggregations: _immutable.default.fromJS({ aggregations: 'aggregations' }) } };


    props = (0, _FiltersFromProperties.mapStateToProps)(state, { storeKey: 'library' });
  });

  it('should concat the modelPrefix with the model', () => {
    props.properties = [
    { name: 'textFilter', label: 'textLabel' }];


    props.modelPrefix = '.prefix';

    const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_TextFilter.default);
    expect(component).toMatchSnapshot();
  });

  describe('when type is text', () => {
    it('should render a text filter', () => {
      props.properties = [
      { name: 'textFilter', label: 'textLabel' }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_TextFilter.default);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is select, multiselect or relationship', () => {
    it('should render a select filter', () => {
      props.properties = [
      { name: 'selectFilter', label: 'selectLabel', type: 'select', options: [{ label: 'option1' }] },
      { name: 'multiselectFilter', label: 'multiselectLabel', type: 'multiselect', options: [{ label: 'option3' }] },
      { name: 'relationshipFilter', label: 'relationshipLabel', type: 'relationship', options: [{ label: 'option2' }] }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_SelectFilter.default);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is date, multidate, multidaterange or daterange', () => {
    it('should render a date filter', () => {
      props.properties = [
      { name: 'dateFilter', label: 'dateLabel', type: 'date' },
      { name: 'daterange', label: 'daterangeLabel', type: 'daterange' },
      { name: 'multidate', label: 'multidateLabel', type: 'multidate' },
      { name: 'multidaterange', label: 'multidaterangeLabel', type: 'multidaterange' }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_DateFilter.default);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is numeric', () => {
    it('should render a number range filter', () => {
      props.properties = [
      { name: 'numericFilter', label: 'numericLabel', type: 'numeric' }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_NumberRangeFilter.default);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is nested', () => {
    it('should render a number range filter', () => {
      props.properties = [
      { name: 'nestedFilter', label: 'nestedLabel', type: 'nested' }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_NestedFilter.default);
      expect(component).toMatchSnapshot();
    });
  });
  describe('when type is relationshipFilter', () => {
    it('should render a relationshipFilter', () => {
      props.properties = [
      { name: 'relationshipfilter', label: 'relationshipfilterLabel', type: 'relationshipfilter', filters: [{ name: 'filter' }] }];


      const component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersFromProperties.FiltersFromProperties, props)).find(_RelationshipFilter.default);
      expect(component).toMatchSnapshot();
    });
  });
});