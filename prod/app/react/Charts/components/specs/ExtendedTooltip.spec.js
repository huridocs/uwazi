"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _ExtendedTooltip = _interopRequireDefault(require("../ExtendedTooltip"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ExtendedTooltip', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ExtendedTooltip.default, props));
  };

  it('should render empty when inactive (default)', () => {
    render();
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should render values and labels from both sets if active', () => {
    props.active = true;
    props.payload = [
    { value: 1, payload: { name: 'nameA', setALabel: 'labelA' } },
    { value: 2, payload: { name: 'nameB', setBLabel: 'labelB' } }];


    render();
    expect(component.text()).toBe('nameA:  3labelA:  1labelB:  2');
  });
});