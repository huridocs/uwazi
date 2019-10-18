"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _NumericRange = _interopRequireDefault(require("../NumericRange"));
var _Numeric = _interopRequireDefault(require("../Numeric"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NumericRange', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      model: 'model',
      onChange: jasmine.createSpy('onChange'),
      value: { from: 2, to: 4 } };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_NumericRange.default, props));
  };

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      render();
      component.find(_Numeric.default).first().simulate('change', 0.23);
      expect(props.onChange).toHaveBeenCalledWith({ from: 0.23, to: 4 });
      component.find(_Numeric.default).last().simulate('change', 86);
      expect(props.onChange).toHaveBeenCalledWith({ from: 0.23, to: 86 });
    });
  });
});