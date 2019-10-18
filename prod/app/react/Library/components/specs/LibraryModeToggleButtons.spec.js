"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../../I18N");

var _LibraryModeToggleButtons = require("../LibraryModeToggleButtons");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('LibraryModeToggleButtons', () => {
  let component;
  let props;
  let state;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_LibraryModeToggleButtons.LibraryModeToggleButtons, props));
  };

  describe('render()', () => {
    beforeEach(() => {
      props = {
        searchUrl: '?q="asd"',
        showGeolocation: true,
        zoomIn: jasmine.createSpy('zoomIn'),
        zoomOut: jasmine.createSpy('zoomOut'),
        zoomLevel: 3,
        numberOfMarkers: 23 };

      render();
    });

    it('should render two links to the library and the map', () => {
      expect(component.find(_I18N.I18NLink).length).toBe(2);
      expect(component.find(_I18N.I18NLink).at(0).props().to).toBe('library?q="asd"');
      expect(component.find(_I18N.I18NLink).at(1).props().to).toBe('library/map?q="asd"');
    });

    it('should hold zoom buttons', () => {
      let zoomButtons = component.find('div.list-view-mode-zoom');
      expect(zoomButtons.props().className).toContain('list-view-buttons-zoom-3');

      props.zoomLevel = 4;
      render();
      zoomButtons = component.find('div.list-view-mode-zoom');
      expect(zoomButtons.props().className).toContain('list-view-buttons-zoom-4');

      expect(props.zoomIn).not.toHaveBeenCalled();
      expect(props.zoomOut).not.toHaveBeenCalled();

      zoomButtons.find('.zoom-in').simulate('click');
      expect(props.zoomIn).toHaveBeenCalled();

      zoomButtons.find('.zoom-out').simulate('click');
      expect(props.zoomOut).toHaveBeenCalled();
    });

    describe('when showGeolocation is false', () => {
      it('should not render buttons', () => {
        props.showGeolocation = false;
        render();
        expect(component.find('div.list-view-mode-map').length).toBe(0);
      });
    });
  });

  describe('mapStateToProps()', () => {
    beforeEach(() => {
      props = { storeKey: 'library' };
      state = {
        library: {
          search: {},
          filters: _immutable.default.fromJS({ properties: [] }),
          ui: _immutable.default.fromJS({ zoomLevel: 1 }),
          markers: _immutable.default.fromJS({ rows: [] }) },

        templates: _immutable.default.fromJS([{ properties: [{ type: 'geolocation' }] }]) };

    });
    it('should map the search url and check if any template has a geolocation field', () => {
      const mappedProps = (0, _LibraryModeToggleButtons.mapStateToProps)(state, props);
      expect(mappedProps.showGeolocation).toBe(true);
      expect(mappedProps.searchUrl).toBe('?q=()');
    });

    it('should map the zoom level', () => {
      expect((0, _LibraryModeToggleButtons.mapStateToProps)(state, props).zoomLevel).toBe(1);
      expect((0, _LibraryModeToggleButtons.mapStateToProps)(state, Object.assign({}, props, { zoomLevel: 'externallyPassed' })).zoomLevel).toBe('externallyPassed');
    });
  });
});