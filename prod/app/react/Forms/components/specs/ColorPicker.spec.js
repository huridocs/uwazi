"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactColor = require("react-color");

var _ColorPicker = _interopRequireDefault(require("../ColorPicker"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ColorPicker', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      defaultValue: '#112233',
      onChange: jest.fn() };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ColorPicker.default, props));
  };

  const renderAndActivate = () => {
    render();
    component.setState({ active: true });
    component.update();
  };

  it('should render ColorPicker button with specified value as color', () => {
    props.value = '#ffffff';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should show defaultValue color if value is not provided', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when button is clicked', () => {
    it('should display color picker if hidden', () => {
      render();
      component.find('.ColorPicker__button').first().simulate('click');
      component.update();
      expect(component).toMatchSnapshot();
    });
    it('should hide color picker if displayed', () => {
      renderAndActivate();
      component.find('.ColorPicker__button').first().simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  describe('when color picker is displayed', () => {
    it('should close when clicking outside', () => {
      renderAndActivate();
      component.find('.ColorPicker__cover').first().simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  it('should call onChange with when new color is selected', () => {
    renderAndActivate();
    component.find(_reactColor.TwitterPicker).prop('onChangeComplete')({ hex: '#001100' });
    expect(props.onChange).toHaveBeenCalledWith('#001100');
  });
});