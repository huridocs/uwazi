"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _SearchInput = _interopRequireDefault(require("../../../Layout/SearchInput"));
var _SearchForm = require("../SearchForm");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      search: jasmine.createSpy('search'),
      connectionType: 'basic' };

    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchForm.SearchForm, props));
  });

  describe('onChange', () => {
    it('should search passing target.value', () => {
      component.find(_SearchInput.default).simulate('change', { target: { value: 'searchTerm' } });
      expect(props.search).toHaveBeenCalledWith('searchTerm', 'basic');
    });
  });
});