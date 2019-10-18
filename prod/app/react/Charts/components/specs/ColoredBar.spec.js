"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _recharts = require("recharts");

var _colorScheme = _interopRequireWildcard(require("../../utils/colorScheme"));
var _ColoredBar = _interopRequireDefault(require("../ColoredBar"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ColoredBar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ColoredBar.default, props));
  };

  it('should render a rectangle passing props with the passed index color', () => {
    render();
    const { fill, stroke } = component.find(_recharts.Rectangle).props();
    expect(fill).toBe(_colorScheme.default[0]);
    expect(stroke).toBe('none');
  });

  it('should allow passing the light color scheme', () => {
    props.color = 'light';
    props.index = 3;
    render();
    const { index, fill } = component.find(_recharts.Rectangle).props();
    expect(index).toBe(props.index);
    expect(fill).toBe(_colorScheme.light[3]);
  });
});