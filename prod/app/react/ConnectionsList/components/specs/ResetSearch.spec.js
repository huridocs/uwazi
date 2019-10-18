"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _ResetSearch = require("../ResetSearch");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ResetSearch', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connectionsGroups: (0, _immutable.fromJS)([]),
      resetSearch: jasmine.createSpy('resetSearch') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ResetSearch.ResetSearch, props));
  };

  it('should hold a button that resets the search', () => {
    render();
    expect(props.resetSearch).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(props.resetSearch).toHaveBeenCalled();
  });
});