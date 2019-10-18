"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _RelationshipFilter = _interopRequireDefault(require("../RelationshipFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationshipFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
      property: { name: 'name', filters: [{ name: 'text' }] },
      translationContext: 'context',
      storeKey: 'storeKey' };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_RelationshipFilter.default, props));
    expect(component).toMatchSnapshot();
  });
});