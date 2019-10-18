"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _MultiDate = _interopRequireDefault(require("../MultiDate"));
var _DatePicker = _interopRequireDefault(require("../DatePicker"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('MultiDate', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [1473984000, 1474070400, 1474156800],
      onChange: jasmine.createSpy('onChange') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MultiDate.default, props));
  };

  it('should render a DatePicker for each value', () => {
    render();
    const datepickers = component.find(_DatePicker.default);
    expect(datepickers.length).toBe(3);
  });

  describe('changing a datepicker', () => {
    it('should call onChange with the new array of values', () => {
      render();
      const datepickers = component.find(_DatePicker.default);
      datepickers.first().simulate('change', 1234);
      expect(props.onChange).toHaveBeenCalledWith([1234, 1474070400, 1474156800]);
    });
  });

  describe('adding a date', () => {
    it('should add a value to the state', () => {
      render();
      const addButton = component.find('.btn-success');
      addButton.simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([1473984000, 1474070400, 1474156800, null]);
    });
  });

  describe('removing a date', () => {
    it('should remove the value from the state', () => {
      render();
      const removeButtons = component.find('.react-datepicker__delete-icon');
      removeButtons.first().simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([1474070400, 1474156800]);
      expect(props.onChange).toHaveBeenCalledWith([1474070400, 1474156800]);
    });
  });
});