"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _LibraryFilters = require("../LibraryFilters");
var _SidePanel = _interopRequireDefault(require("../../../Layout/SidePanel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('LibraryFilters', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { open: true };
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_LibraryFilters.LibraryFilters, props));
  };

  it('shoud have library-filters class', () => {
    render();
    expect(component.find(_SidePanel.default).hasClass('library-filters')).toBe(true);
  });

  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      const store = {
        library: {
          filters: _immutable.default.fromJS({ properties: 'filters state', documentTypes: ['Decision'] }),
          ui: _immutable.default.fromJS({ searchTerm: 'Zerg Rush', filtersPanel: true, selectedDocuments: [] }),
          aggregations: _immutable.default.fromJS({ types: { buckets: [] } }),
          settings: _immutable.default.fromJS({ collection: { filters: [] } }) },

        templates: _immutable.default.fromJS([]) };


      const state = (0, _LibraryFilters.mapStateToProps)(store, { storeKey: 'library' });

      expect(state).toEqual({ open: true });
    });
  });
});