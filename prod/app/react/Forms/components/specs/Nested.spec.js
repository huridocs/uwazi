"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Nested = _interopRequireDefault(require("../Nested"));
var _MarkDown = _interopRequireDefault(require("../MarkDown"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Nested', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [
      { prop1: ['1', '2'], prop2: ['1', '2'] },
      { prop1: ['2.1', '3'], prop2: ['2'] }],

      onChange: jasmine.createSpy() };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Nested.default, props));
  };

  it('should render a markdown with the pased value', () => {
    render();
    const markdown = component.find(_MarkDown.default);
    expect(markdown.length).toBe(1);
    expect(markdown.props().value).toBe('| prop1 | prop2 |\n| - | - |\n| 1,2 | 1,2 |\n| 2.1,3 | 2 |');
  });

  describe('onChange', () => {
    it('should parse the markdown value in to an object', () => {
      render();
      const markdown = component.find(_MarkDown.default);
      markdown.simulate('change', { target: { value: '|prop1 | prop2\n|- | -|\n|1,2 | 1,2|\n|2.1,3 | 2|' } });
      expect(props.onChange).toHaveBeenCalledWith([
      { prop1: ['1', '2'], prop2: ['1', '2'] },
      { prop1: ['2.1', '3'], prop2: ['2'] }]);

    });
  });
});