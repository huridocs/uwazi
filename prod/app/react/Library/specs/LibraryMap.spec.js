"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _LibraryMap = _interopRequireDefault(require("../LibraryMap"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _MapView = _interopRequireDefault(require("../components/MapView"));
var _LibraryModeToggleButtons = _interopRequireDefault(require("../components/LibraryModeToggleButtons"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('LibraryMap', () => {
  let component;
  let instance;

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    const props = { location: { query: { q: '(a:1)' } } };
    const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };

    component = (0, _enzyme.shallow)(_react.default.createElement(_LibraryMap.default, props), { context });
    instance = component.instance();
  });

  it('should render the MapView', () => {
    expect(component.find(_MapView.default).props().storeKey).toBe('library');
  });

  it('should include the Toggle Buttons with zoom in and out functionality', () => {
    const zoomIn = jasmine.createSpy('zoomIn');
    const zoomOut = jasmine.createSpy('zoomOut');

    instance.mapView = { getWrappedInstance: () => ({ map: { zoomIn, zoomOut } }) };
    const libraryButtons = component.find(_LibraryModeToggleButtons.default);

    expect(libraryButtons.props().zoomLevel).toBe(0);
    expect(libraryButtons.props().storeKey).toBe('library');

    expect(zoomIn).not.toHaveBeenCalled();
    expect(zoomOut).not.toHaveBeenCalled();

    libraryButtons.props().zoomIn();
    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).not.toHaveBeenCalled();

    libraryButtons.props().zoomOut();
    expect(zoomOut).toHaveBeenCalled();
  });
});