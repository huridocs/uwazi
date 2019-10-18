"use strict";var _react = _interopRequireDefault(require("react"));

var _BasicReducer = require("../../BasicReducer");
var _Markdown = require("../../Markdown");
var _enzyme = require("enzyme");
var _PageViewer = _interopRequireDefault(require("../components/PageViewer"));
var _PagesAPI = _interopRequireDefault(require("../PagesAPI"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _ViewMetadataPanel = _interopRequireDefault(require("../../Library/components/ViewMetadataPanel"));
var _SelectMultiplePanelContainer = _interopRequireDefault(require("../../Library/containers/SelectMultiplePanelContainer"));
var _SearchAPI = _interopRequireDefault(require("../../Search/SearchAPI"));
var _RequestParams = require("../../utils/RequestParams");

var _PageView = _interopRequireDefault(require("../PageView"));
var _pageItemLists = _interopRequireDefault(require("../utils/pageItemLists"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('PageView', () => {
  let component;
  let instance;
  let context;

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_jsx(_PageView.default, {}), { context });
    instance = component.instance();
  });

  it('should render a PageViewer', () => {
    expect(component.find(_PageViewer.default).length).toBe(1);
  });

  it('should render a ViewMetadataPanel', () => {
    expect(component.find(_ViewMetadataPanel.default).length).toBe(1);
    expect(component.find(_ViewMetadataPanel.default).props().storeKey).toBe('library');
  });

  it('should render SelectMultiplePanelContainer', () => {
    expect(component.find(_SelectMultiplePanelContainer.default).length).toBe(1);
    expect(component.find(_SelectMultiplePanelContainer.default).props().storeKey).toBe('library');
  });

  describe('onunmount', () => {
    it('should emptyState', () => {
      spyOn(instance, 'emptyState');

      component.unmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState', () => {
    it('should closeSidePanel, and unset sate data', () => {
      spyOn(instance, 'closeSidePanel');
      instance.emptyState();

      expect(instance.closeSidePanel).toHaveBeenCalled();
      expect(context.store.dispatch).toHaveBeenCalledWith(_BasicReducer.actions.unset('page/pageView'));
      expect(context.store.dispatch).toHaveBeenCalledWith(_BasicReducer.actions.unset('page/itemLists'));
      expect(context.store.dispatch).toHaveBeenCalledWith(_BasicReducer.actions.unset('page/datasets'));
    });
  });

  describe('closeSidePanel', () => {
    it('should unselectAllDocuments', () => {
      instance.closeSidePanel();
      expect(context.store.dispatch).toHaveBeenCalledWith({ __reducerKey: 'library', type: 'UNSELECT_ALL_DOCUMENTS' });
    });
  });

  describe('Static requestState()', () => {
    const page = { _id: 'abc2', title: 'Page 1', metadata: { content: 'originalContent' } };

    let data;
    let request;

    beforeEach(() => {
      spyOn(_PagesAPI.default, 'getById').and.returnValue(Promise.resolve(page));

      spyOn(_pageItemLists.default, 'generate').and.returnValue({
        content: 'parsedContent',
        params: ['?q=(a:1,b:2)', '', '?q=(x:1,y:!(%27array%27),limit:24)', '?order=metadata.form&treatAs=number'],
        options: [{}, { limit: 9 }, { limit: 0 }, { limit: 12 }] });


      let searchCalls = -1;
      spyOn(_SearchAPI.default, 'search').and.callFake(() => {
        searchCalls += 1;
        return Promise.resolve({ rows: [`resultsFor:${searchCalls}`] });
      });

      data = { sharedId: 'abc2' };
      request = new _RequestParams.RequestParams(data, 'headers');
    });

    it('should request page for view', async () => {
      const stateActions = await _PageView.default.requestState(request);

      expect(_PagesAPI.default.getById).toHaveBeenCalledWith(request);
      expect(stateActions).toMatchSnapshot();
    });

    const assertItemLists = itemLists => {
      expect(itemLists.length).toBe(4);
      expect(itemLists[0].params).toBe('?q=(a:1,b:2)');
      expect(itemLists[0].items).toEqual(['resultsFor:0']);
      expect(itemLists[1].params).toBe('');
      expect(itemLists[1].items).toEqual(['resultsFor:1']);
      expect(itemLists[2].params).toBe('?q=(x:1,y:!(%27array%27),limit:24)');
      expect(itemLists[2].items).toEqual(['resultsFor:2']);
      expect(itemLists[3].params).toBe('?order=metadata.form&treatAs=number');
      expect(itemLists[3].items).toEqual(['resultsFor:3']);
      expect(itemLists[3].options).toEqual({ limit: 12 });
    };

    it('should request each list inside the content limited to 6 items (default) or the passed value and set the state', async () => {
      const stateActions = await _PageView.default.requestState(request);

      expect(_SearchAPI.default.search.calls.count()).toBe(4);
      expect(JSON.parse(JSON.stringify(_SearchAPI.default.search.calls.argsFor(0)[0]))).toEqual({
        data: { a: 1, b: 2, limit: '6' },
        headers: 'headers' });

      expect(_SearchAPI.default.search.calls.argsFor(1)[0]).toEqual({
        data: { filters: {}, types: [], limit: '9' },
        headers: 'headers' });


      expect(JSON.parse(JSON.stringify(_SearchAPI.default.search.calls.argsFor(2)[0]))).toEqual({
        data: {
          x: 1,
          y: ['array'],
          limit: '6' },

        headers: 'headers' });

      expect(_SearchAPI.default.search.calls.argsFor(3)[0]).toEqual({
        data: { filters: {}, types: [], limit: '12' },
        headers: 'headers' });


      const itemLists = stateActions[1].value;
      assertItemLists(itemLists);
    });

    it('should request each dataset inside the content', async () => {
      const markdownDatasetsResponse = { request1: 'url1', request2: 'url2' };
      spyOn(_Markdown.markdownDatasets, 'fetch').and.returnValue(Promise.resolve(markdownDatasetsResponse));

      const stateActions = await _PageView.default.requestState(request);
      expect(_Markdown.markdownDatasets.fetch).toHaveBeenCalledWith('originalContent', request.onlyHeaders());
      expect(stateActions[2].value).toEqual(markdownDatasetsResponse);
    });
  });
});