"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _Library = _interopRequireDefault(require("../Library"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _store = _interopRequireDefault(require("../../store"));
var _DocumentsList = _interopRequireDefault(require("../components/DocumentsList"));
var _LibraryModeToggleButtons = _interopRequireDefault(require("../components/LibraryModeToggleButtons"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Library', () => {
  const templates = [
  { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
  { name: 'Ruling', _id: 'abc2', properties: [] }];

  const thesauris = [{ name: 'countries', _id: '1', values: [] }];
  (0, _store.default)({ templates, thesauris });
  let component;
  let instance;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  let dispatchCallsOrder = [];

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    dispatchCallsOrder = [];
    context = { store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {dispatchCallsOrder.push(action.type);}) } };


    component = (0, _enzyme.shallow)(_react.default.createElement(_Library.default, props), { context });
    instance = component.instance();
  });

  it('should render the DocumentsList (by default)', () => {
    expect(component.find(_DocumentsList.default).length).toBe(1);
    expect(component.find(_DocumentsList.default).props().storeKey).toBe('library');
  });

  it('should include the Toggle Buttons with zoom in and out functionality', () => {
    const libraryButtons = component.find(_LibraryModeToggleButtons.default);
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY']);
    libraryButtons.props().zoomIn();
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY', 'ZOOM_IN']);
    libraryButtons.props().zoomOut();
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY', 'ZOOM_IN', 'ZOOM_OUT']);
  });

  describe('urlHasChanged', () => {
    it('return true when q has changed', () => {
      const nextProps = { location: { query: { q: '(a:2)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(true);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { query: { q: '(a:1)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(false);
    });
  });
});