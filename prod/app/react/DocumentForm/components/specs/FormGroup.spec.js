"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _FormGroup = _interopRequireDefault(require("../FormGroup"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormGroup.default, props));
  };

  it('should render errors when touched and invalid', () => {
    props.pristine = false;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.pristine = false;
    props.submitFailed = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should not render errors when not touched', () => {
    props.pristine = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });

  it('should not render errors when submitFailed with no errors', () => {
    props.submitFailed = true;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });
});