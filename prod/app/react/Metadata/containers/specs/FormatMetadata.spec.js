"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _FormatMetadata = _interopRequireDefault(require("../FormatMetadata"));
var _selectors = require("../../selectors");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormatMetadata', () => {
  it('should render Metadata component passing the formatted metadata', () => {
    spyOn(_selectors.metadataSelectors, 'formatMetadata').and.returnValue([{ formated: 'metadata' }]);
    const props = {
      templates: [],
      thesauris: [],
      entity: {},
      sortedProperty: 'sortedProperty' };

    const component = (0, _enzyme.shallow)(_react.default.createElement(_FormatMetadata.default.WrappedComponent, props));
    expect(component).toMatchSnapshot();
  });

  it('should unshift additional metadata if passed', () => {
    spyOn(_selectors.metadataSelectors, 'formatMetadata').and.returnValue([{ formated: 'metadata' }]);
    const props = {
      templates: [],
      thesauris: [],
      entity: {},
      sortedProperty: 'sortedProperty',
      additionalMetadata: [{ more: 'data' }, { and: 'more' }] };

    const component = (0, _enzyme.shallow)(_react.default.createElement(_FormatMetadata.default.WrappedComponent, props));
    expect(component).toMatchSnapshot();
  });
});