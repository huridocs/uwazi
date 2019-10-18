"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _BackButton = _interopRequireDefault(require("../BackButton"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('Icon', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_BackButton.default, props));
  };

  it('should render the back button to the provided url', () => {
    props = { to: '/some/url' };
    render();
    expect(component).toMatchSnapshot();
  });
});