"use strict";var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _SearchBar = require("../SearchBar");
var _enzyme = require("enzyme");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchBar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = jasmine.createSpyObj(['searchDocuments', 'change', 'semanticSearch']);
    props.search = { searchTerm: 'Find my document', sort: 'title', filters: { isBatman: true } };
    props.storeKey = 'library';
    props.semanticSearchEnabled = true;
    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchBar.SearchBar, props));
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm filters and sort', () => {
      component.find(_reactReduxForm.Form).simulate('submit', 'SEARCH MODEL VALUES');
      expect(props.searchDocuments).toHaveBeenCalledWith({ search: 'SEARCH MODEL VALUES' }, props.storeKey);
    });
  });

  describe('maped state', () => {
    it('should contain the searchTerm', () => {
      const store = {
        library: {
          ui: _immutable.default.fromJS({ filtersPanel: true }),
          search: { searchTerm: 'search' },
          filters: _immutable.default.fromJS({ properties: [], documentTypes: [] }) },

        settings: { collection: _immutable.default.fromJS({ features: { semanticSearch: false } }) } };


      const state = (0, _SearchBar.mapStateToProps)(store, { storeKey: 'library' });
      expect(state).toEqual({ search: { searchTerm: 'search', filters: {}, limit: undefined, types: [] }, semanticSearchEnabled: false });
    });
  });
});