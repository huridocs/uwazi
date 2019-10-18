"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = require("immutable");
var _EntitiesAPI = _interopRequireDefault(require("../../Entities/EntitiesAPI"));
var _BasicReducer = require("../../BasicReducer");

var _reactRouter = require("react-router");
var _enzyme = require("enzyme");
var _ViewDocument = _interopRequireDefault(require("../ViewDocument"));
var _Viewer = _interopRequireDefault(require("../components/Viewer"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var relationships = _interopRequireWildcard(require("../../Relationships/utils/routeUtils"));
var utils = _interopRequireWildcard(require("../../utils"));
var _RequestParams = require("../../utils/RequestParams");

var routeActions = _interopRequireWildcard(require("../actions/routeActions"));
var uiActions = _interopRequireWildcard(require("../actions/uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('ViewDocument', () => {
  let component;
  let instance;
  let context;
  let props;

  const render = () => {
    _RouteHandler.default.renderedFromServer = true;
    component = (0, _enzyme.shallow)(_react.default.createElement(_ViewDocument.default, props), { context });
    instance = component.instance();
  };

  beforeEach(() => {
    const dispatch = jasmine.createSpy('dispatch');
    context = { store: {
        getState: () => ({}),
        dispatch: dispatch.and.callFake(action => typeof action === 'function' ? action(dispatch) : action) } };

    props = { location: { query: {} }, routes: [] };

    render();

    spyOn(routeActions, 'requestViewerState');

    spyOn(routeActions, 'setViewerState').and.returnValue({ type: 'setViewerState' });
  });

  it('should pass down raw property', () => {
    props.location = { query: { raw: 'true', page: 2 } };
    render();
    expect(component.find(_Viewer.default).props().raw).toEqual(true);
  });

  describe('when on server', () => {
    it('should always pass raw true', () => {
      props.location = { query: { raw: 'false' } };
      utils.isClient = false;
      render();
      expect(component.find(_Viewer.default).props().raw).toBe(true);
      utils.isClient = true;
    });
  });

  it('should render the Viewer', () => {
    expect(component.find(_Viewer.default).length).toBe(1);
  });

  describe('when raw', () => {
    it('should render link canonical to the not raw version', () => {
      props.location = { query: { raw: 'true', page: 1 }, pathname: 'pathname' };
      render();
      expect(component.find('link')).toMatchSnapshot();
    });
  });

  describe('when not raw', () => {
    it('should not render link canonical', () => {
      props.location = { query: { raw: 'false', page: 1 }, pathname: 'pathname' };
      render();
      expect(component.find('link').length).toBe(0);
    });
  });

  describe('static requestState', () => {
    it('should call on requestViewerState', () => {
      const requestParams = new _RequestParams.RequestParams({ documentId: 'documentId', lang: 'es', page: 4, raw: 'true' });
      _ViewDocument.default.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).
      toHaveBeenCalledWith(new _RequestParams.RequestParams({ documentId: 'documentId', lang: 'es', raw: true, page: 4 }), 'globalResources');
    });

    it('should modify raw to true if is server side rendered', () => {
      utils.isClient = false;
      const requestParams = new _RequestParams.RequestParams({ documentId: 'documentId', lang: 'es', raw: 'false' });
      _ViewDocument.default.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).
      toHaveBeenCalledWith(new _RequestParams.RequestParams({ documentId: 'documentId', lang: 'es', raw: true }), 'globalResources');
    });
  });

  describe('onDocumentReady', () => {
    it('should scrollToPage on the query when not on raw mode', () => {
      spyOn(uiActions, 'scrollToPage');
      props.location = { query: { raw: 'false', page: 15 }, pathname: 'pathname' };
      render();

      instance.onDocumentReady();
      expect(uiActions.scrollToPage).toHaveBeenCalledWith(15, 0);

      props.location = { query: { raw: 'true', page: 15 }, pathname: 'pathname' };
      render();
      uiActions.scrollToPage.calls.reset();
      instance.onDocumentReady();
      expect(uiActions.scrollToPage).not.toHaveBeenCalled();
    });

    it('should activate text reference if query parameters have reference id', () => {
      spyOn(uiActions, 'activateReference');
      props.location = { query: { raw: 'false', ref: 'refId' }, pathname: 'pathname' };
      const pdfInfo = { 1: { chars: 100 } };
      const reference = { _id: 'refId', range: { start: 200, end: 300 }, text: 'test' };
      const doc = (0, _immutable.fromJS)({
        pdfInfo,
        relationships: [
        { _id: 'otherRef' },
        reference] });


      render();
      instance.onDocumentReady(doc);
      expect(uiActions.activateReference).toHaveBeenCalledWith(reference, pdfInfo);
    });

    it('should emit documentLoaded event', () => {
      spyOn(uiActions, 'scrollToPage');
      spyOn(utils.events, 'emit');
      render();

      instance.onDocumentReady();
      expect(utils.events.emit).toHaveBeenCalledWith('documentLoaded');
    });
  });

  describe('changePage', () => {
    describe('when raw', () => {
      it('should changeBrowserHistoryPage', () => {
        props.location = { query: { raw: true, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
        spyOn(uiActions, 'scrollToPage');
        render();
        spyOn(instance, 'changeBrowserHistoryPage');

        instance.changePage(16);
        expect(instance.changeBrowserHistoryPage).toHaveBeenCalledWith(16);
        expect(uiActions.scrollToPage).not.toHaveBeenCalled();
      });
    });

    describe('when not raw', () => {
      it('should scrollToPage', () => {
        props.location = { query: { raw: false, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
        spyOn(uiActions, 'scrollToPage');
        render();
        spyOn(instance, 'changeBrowserHistoryPage');

        instance.changePage(16);
        expect(instance.changeBrowserHistoryPage).not.toHaveBeenCalled();
        expect(uiActions.scrollToPage).toHaveBeenCalledWith(16);
      });
    });
  });

  describe('componentWillReceiveProps', () => {
    const setProps = newProps => {
      _EntitiesAPI.default.getRawPage.calls.reset();
      component.setProps(newProps);
      component.update();
    };

    beforeEach(() => {
      props.location = { query: { raw: 'true', anotherProp: 'test', page: 15 }, pathname: 'pathname' };
      props.params = { sharedId: 'documentId' };
      spyOn(_EntitiesAPI.default, 'getRawPage').and.returnValue(Promise.resolve('raw text'));
      render();
    });

    it('should load raw page when page/raw changes and raw is true', async () => {
      setProps({ location: { query: { page: 15, raw: 'true' } } });
      expect(_EntitiesAPI.default.getRawPage).not.toHaveBeenCalled();

      setProps({ location: { query: { page: 16, raw: 'false' } } });
      expect(_EntitiesAPI.default.getRawPage).not.toHaveBeenCalled();

      _EntitiesAPI.default.getRawPage.calls.reset();
      await instance.componentWillReceiveProps({ params: { sharedId: 'documentId' }, location: { query: { page: 17, raw: 'true' } } });
      expect(context.store.dispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('viewer/rawText', 'raw text'));
      expect(_EntitiesAPI.default.getRawPage).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'documentId', pageNumber: 17 }));
    });
  });

  describe('changeBrowserHistoryPage', () => {
    it('should push new browserHistory with new page', () => {
      props.location = { query: { raw: true, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
      spyOn(_reactRouter.browserHistory, 'push');
      render();

      instance.changeBrowserHistoryPage(16);
      expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('pathname?raw=true&anotherProp=test&page=16');

      component.setProps({ location: { query: { raw: false, page: 15 }, pathname: 'pathname' } });
      component.update();
      instance.changeBrowserHistoryPage(16);
      expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('pathname?page=16');
    });
  });

  describe('componentWillUnmount()', () => {
    it('should call emptyState', () => {
      spyOn(instance, 'emptyState');
      instance.componentWillUnmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState()', () => {
    beforeEach(() => {
      spyOn(relationships, 'emptyState').and.returnValue({ type: 'relationshipsEmptyState' });
    });

    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: [] });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/templates/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/thesauris/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/relationTypes/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'rrf/reset', model: 'documentViewer.tocForm' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/targetDoc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'relationshipsEmptyState' });
    });
  });
});