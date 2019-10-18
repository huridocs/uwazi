"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _reactReduxForm = require("react-redux-form");
var _NestedMultiselect = _interopRequireDefault(require("../NestedMultiselect"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NestedMultiselect', () => {
  let component;
  let props;
  const aggregations = {
    all: {
      nested_property: {
        acd: {
          buckets: [
          {
            key: '1',
            doc_count: 4,
            filtered: {
              doc_count: 2,
              total: { doc_count: 4, filtered: { doc_count: 2 } } } },


          {
            key: '1.1',
            doc_count: 3,
            filtered: {
              doc_count: 2,
              total: { doc_count: 3, filtered: { doc_count: 2 } } } }] },




        cjh: {
          buckets: [
          {
            key: '2',
            doc_count: 4,
            filtered: {
              doc_count: 2,
              total: { doc_count: 4, filtered: { doc_count: 2 } } } },


          {
            key: '1.2',
            doc_count: 3,
            filtered: {
              doc_count: 2,
              total: { doc_count: 4, filtered: { doc_count: 2 } } } }] },




        acb: {
          buckets: [
          {
            key: 'missing',
            doc_count: 3,
            filtered: {
              doc_count: 2,
              total: { doc_count: 4, filtered: { doc_count: 2 } } } }] } } } };








  beforeEach(() => {
    props = {
      label: 'input label',
      value: [],
      property: { name: 'nested_property', nestedProperties: ['acd', 'cjh', 'acb'] },
      onChange: jasmine.createSpy('onChange'),
      aggregations: _immutable.default.fromJS(aggregations) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_NestedMultiselect.default, props));
  };

  it('should render the groups', () => {
    render();
    const optionElements = component.find(_reactReduxForm.Control);
    expect(optionElements.length).toBe(2);
    expect(optionElements.first().props().model).toBe('.filters.nested_property.properties.acd.values');
    expect(optionElements.first().props().options).toEqual([{ label: '1', results: 2, value: '1' }, { label: '1.1', results: 2, value: '1.1' }]);

    expect(optionElements.last().props().model).toBe('.filters.nested_property.properties.cjh.values');
    expect(optionElements.first().props().options).toEqual([{ label: '1', results: 2, value: '1' }, { label: '1.1', results: 2, value: '1.1' }]);
  });
});