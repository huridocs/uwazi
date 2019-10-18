"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Switcher = _interopRequireDefault(require("../Switcher"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Switcher', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: true,
      onChange: jasmine.createSpy('onChange'),
      prefix: 'my' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Switcher.default, props));
  };

  it('should render an input with the value and prefix passed', () => {
    render();
    const input = component.find('input');
    expect(input.props().checked).toBe(true);
    expect(input.props().id).toBe('myswitcher');
    const label = component.find('label');
    expect(label.props().htmlFor).toBe('myswitcher');
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      const input = component.find('input');
      input.simulate('change', { target: { checked: false } });
      expect(props.onChange).toHaveBeenCalledWith(false);
    });
  });
});