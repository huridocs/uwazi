"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _ResultsFiltersPanel = require("../ResultsFiltersPanel");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ResultsFiltersPanel', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      open: true,
      filtersValues: { threshold: 0.8 } };


    component = (0, _enzyme.shallow)(_react.default.createElement(_ResultsFiltersPanel.ResultsFiltersPanel, props));
  });

  describe('render', () => {
    it('should render search filters and instructions', () => {
      expect(component).toMatchSnapshot();
    });
  });
});