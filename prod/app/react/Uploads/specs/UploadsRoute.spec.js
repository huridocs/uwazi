"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _rison = _interopRequireDefault(require("rison"));

var _UploadsRoute = _interopRequireDefault(require("../UploadsRoute"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _immutable = require("immutable");
var _RequestParams = require("../../utils/RequestParams");


var _SearchAPI = _interopRequireDefault(require("../../Search/SearchAPI"));
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

describe('UploadsRoute', () => {
  const documents = [{ title: 'Something to publish' }, { title: 'My best recipes' }];
  let component;
  let instance;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  const templates = [
  { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
  { name: 'Ruling', _id: 'abc2', properties: [] }];

  const globalResources = { templates: (0, _immutable.fromJS)(templates), thesauris: (0, _immutable.fromJS)([]), relationTypes: (0, _immutable.fromJS)([]) };

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_UploadsRoute.default, _extends({}, props, { templates: globalResources.templates })), { context });
    instance = component.instance();

    spyOn(_SearchAPI.default, 'search').and.returnValue(Promise.resolve(documents));
  });

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', async () => {
      const query = { q: _rison.default.encode({ filters: { something: 1 }, types: ['types'] }) };
      const expectedSearch = {
        sort: _prioritySortingCriteria.default.get({ templates: (0, _immutable.fromJS)(templates) }).sort,
        order: _prioritySortingCriteria.default.get({ templates: (0, _immutable.fromJS)(templates) }).order,
        filters: { something: 1 },
        types: ['types'],
        unpublished: true };


      const requestParams = new _RequestParams.RequestParams(query);

      await _UploadsRoute.default.requestState(requestParams, globalResources);
      expect(_SearchAPI.default.search).toHaveBeenCalledWith(new _RequestParams.RequestParams(expectedSearch));
      // expect(state.uploads.documents).toEqual(documents);
    });
  });

  describe('componentWillReceiveProps()', () => {
    beforeEach(() => {
      instance.superComponentWillReceiveProps = jasmine.createSpy('superComponentWillReceiveProps');
    });

    it('should update if "q" has changed', () => {
      const nextProps = { location: { query: { q: '(a:2)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).toHaveBeenCalledWith(nextProps);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { query: { q: '(a:1)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).not.toHaveBeenCalled();
    });
  });
});