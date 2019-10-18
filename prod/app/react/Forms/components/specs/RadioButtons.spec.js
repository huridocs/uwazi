"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _RadioButtons = _interopRequireDefault(require("../RadioButtons"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RadioButtons', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: '',
      options: [{ label: 'Option1', value: 'option1' }, { label: 'Option2', value: 'option2' }],
      onChange: jasmine.createSpy('onChange') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_RadioButtons.default, props));
  };

  it('should render the radio buttons', () => {
    render();
    const optionElements = component.find('input[type="radio"]');

    expect(optionElements.length).toBe(2);
    expect(optionElements.first().props().value).toBe('option1');
    expect(optionElements.last().props().value).toBe('option2');
  });

  describe('when clicking an option', () => {
    it('should call onChange with the new value', () => {
      render();
      component.find('input[type="radio"]').first().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith('option1');
      component.find('input[type="radio"]').last().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: '',
        options: [{ name: 'Option1', id: 'option1' }, { name: 'Option2', id: 'option2' }],
        optionsValue: 'id',
        optionsLabel: 'name',
        onChange: () => {} };

      component = (0, _enzyme.shallow)(_react.default.createElement(_RadioButtons.default, props));
    });

    it('should render the options', () => {
      const optionElements = component.find('input[type="radio"]');

      expect(optionElements.length).toBe(2);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.last().props().value).toBe('option2');
    });
  });
});