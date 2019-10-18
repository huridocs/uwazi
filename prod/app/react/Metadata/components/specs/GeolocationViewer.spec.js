"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _GeolocationViewer = _interopRequireDefault(require("../GeolocationViewer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('GeolocationViewer', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      points: [
      { lat: 13, lon: 7, label: 'home' },
      { lat: 5, lon: 10, label: 'work' },
      null,
      { lat: 23, lon: 8, label: '' }] };


  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_GeolocationViewer.default, props));
  };

  it('should render the coordinate values', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render a map with markers when onlyForCards is false, not failing on nulls', () => {
    props.onlyForCards = false;
    render();
    expect(component).toMatchSnapshot();
  });

  it('should not fail if points is just an empty array', () => {
    props.onlyForCards = false;
    props.points = [];
    render();
    expect(component).toMatchSnapshot();
  });
});