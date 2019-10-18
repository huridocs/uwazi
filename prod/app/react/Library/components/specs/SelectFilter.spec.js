"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _SelectFilter = _interopRequireDefault(require("../SelectFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SelectFilter', () => {
  let props;

  beforeEach(() => {
    props = {
      label: 'label',
      model: 'model',
      options: ['options'] };

  });

  it('should render a text filter field with a label and passing the model', () => {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_SelectFilter.default, props));
    expect(component).toMatchSnapshot();
  });

  describe('when showBoolSwitch', () => {
    it('should render the and/or bool switch', () => {
      props = {
        label: 'label',
        model: 'model',
        prefix: 'prefix',
        options: ['options'],
        showBoolSwitch: true };


      const component = (0, _enzyme.shallow)(_react.default.createElement(_SelectFilter.default, props));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when sort prop is set to true', () => {
    it('should activate sorting in the MultiSelect', () => {
      props.sort = true;
      const component = (0, _enzyme.shallow)(_react.default.createElement(_SelectFilter.default, props));
      expect(component).toMatchSnapshot();
    });
  });
});