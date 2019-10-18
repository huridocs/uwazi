"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _SearchInput = _interopRequireDefault(require("../SearchInput"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchInput', () => {
  let component;
  let props;

  const render = () => {
    props = {
      prop1: 'prop1',
      prop2: 'prop2' };

    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchInput.default, props));
  };

  it('should pass all props to the input', () => {
    render();
    const input = component.find('input');

    expect(input.props().prop1).toBe('prop1');
    expect(input.props().prop2).toBe('prop2');
  });
});