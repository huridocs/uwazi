"use strict";var _immutable = require("immutable");
var _reactReduxForm = require("react-redux-form");

var _Notifications = require("../../../Notifications");
var _prioritySortingCriteria = _interopRequireDefault(require("../../../utils/prioritySortingCriteria"));
var _referencesAPI = _interopRequireDefault(require("../../../Viewer/referencesAPI"));
var _RequestParams = require("../../../utils/RequestParams");

var actions = _interopRequireWildcard(require("../actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConnectionsList actions', () => {
  let dispatch;
  let getState;
  let groupedConnections;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    getState = () => ({
      templates: 'templates',
      entityView: { entity: (0, _immutable.fromJS)({ sharedId: 'sid' }) },
      relationships: {
        list: { sharedId: 'sid', sort: { order: 'order' }, filters: (0, _immutable.fromJS)({ filter: 'filter' }) } } });



    groupedConnections = [
    { templates: [{ _id: 't1' }] },
    { templates: [{ _id: 't2' }, { _id: 't3' }] }];


    spyOn(_referencesAPI.default, 'search').and.returnValue(Promise.resolve('searchResults'));
    spyOn(_referencesAPI.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_referencesAPI.default, 'getGroupedByConnection').and.returnValue(Promise.resolve(groupedConnections));
    spyOn(_prioritySortingCriteria.default, 'get').and.returnValue(Promise.resolve('prioritySorting'));
    spyOn(_Notifications.notificationActions, 'notify').and.returnValue('NOTIFIED');
    spyOn(_reactReduxForm.actions, 'merge').and.callFake((scope, sort) => `merge: ${scope} with: ${sort}`);
    spyOn(_reactReduxForm.actions, 'change').and.callFake((scope, sort) => `change: ${scope} with: ${sort || 'empty'}`);
  });

  function checkLoadAllReferences(done, argPos = 0) {
    expect(dispatch.calls.argsFor(argPos)[0].type).toBe('relationships/list/filters/SET');
    expect(dispatch.calls.argsFor(argPos)[0].value.toJS()).toEqual({ filter: 'filter', limit: 9999 });

    expect(_referencesAPI.default.search).
    toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
    done();
  }

  describe('searchReferences', () => {
    it('should fetch the connections with the current state filters, sorting and empty text by default', async () => {
      await actions.searchReferences()(dispatch, getState);
      expect(_referencesAPI.default.search).toHaveBeenCalledWith(
      new _RequestParams.RequestParams({
        sharedId: 'sid',
        filter: 'filter',
        order: 'order',
        searchTerm: '' }));


      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_TAB', tab: 'connections' });
    });

    it('should fetch the connections with the default state when filters is undefined', async () => {
      getState = () => ({
        templates: 'templates',
        entityView: { entity: (0, _immutable.fromJS)({ sharedId: 'sid' }) },
        relationships: {
          list: { sharedId: 'sid', sort: { order: 'order' } } } });



      await actions.searchReferences()(dispatch, getState);

      expect(_referencesAPI.default.search).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sid', order: 'order' }));
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_TAB', tab: 'connections' });
    });

    it('should fetch the connections with custom text search', async () => {
      getState = () => ({
        relationships: {
          list: {
            sharedId: 'sid',
            sort: {},
            filters: (0, _immutable.fromJS)({}),
            search: {
              searchTerm: {
                value: 'term' } } } } });





      await actions.searchReferences()(dispatch, getState);

      expect(_referencesAPI.default.search).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sid', searchTerm: 'term' }));
    });
  });

  describe('connectionsChanged', () => {
    it('should reasssign connectionsGroup, sorting criteria, and call on search again', done => {
      actions.connectionsChanged()(dispatch, getState).
      then(() => {
        expect(_referencesAPI.default.getGroupedByConnection).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sid' }));
        expect(_prioritySortingCriteria.default.get).toHaveBeenCalledWith({
          currentCriteria: { order: 'order' },
          filteredTemplates: ['t1', 't2', 't3'],
          templates: 'templates' });


        expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/connectionsGroups/SET', value: groupedConnections });
        expect(dispatch).toHaveBeenCalledWith('merge: relationships/list.sort with: prioritySorting');
        expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
        done();
      });
    });
  });

  describe('deleteConnection', () => {
    it('should delete the connection and triger a connectionsChanged action', async () => {
      await actions.deleteConnection({ _id: 'id', key: 'value' })(dispatch, getState);

      expect(_referencesAPI.default.delete).toHaveBeenCalledWith(new _RequestParams.RequestParams({ _id: 'id' }));
      expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Connection deleted', 'success');
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/connectionsGroups/SET', value: groupedConnections });
      expect(dispatch).toHaveBeenCalledWith('merge: relationships/list.sort with: prioritySorting');
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
    });
  });

  describe('loadAllReferences', () => {
    it('should set the limit 9999', done => {
      actions.loadAllReferences()(dispatch, getState).
      then(() => {
        checkLoadAllReferences(done);
      });
    });
  });

  describe('loadMoreReferences', () => {
    it('should set the limit to the passed parameter', async () => {
      await actions.loadMoreReferences(60)(dispatch, getState);

      expect(dispatch.calls.argsFor(0)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({ filter: 'filter', limit: 60 });

      expect(_referencesAPI.default.search).
      toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' }));
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
    });
  });

  describe('setFilter', () => {
    it('should merge the passed filter to the exisiting filters', async () => {
      getState = () => ({
        templates: 'templates',
        relationships: {
          list: {
            sharedId: 'sid',
            sort: { order: 'order' },
            filters: (0, _immutable.fromJS)({ filter: (0, _immutable.fromJS)({ oldProperty: 'old', modifiedProperty: 'original' }) }) } } });




      await actions.setFilter({ modifiedProperty: 'modified' })(dispatch, getState);
      expect(dispatch.calls.argsFor(0)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({ filter: { oldProperty: 'old', modifiedProperty: 'modified' } });

      expect(_referencesAPI.default.search).toHaveBeenCalledWith(new _RequestParams.RequestParams(
      { sharedId: 'sid', filter: getState().relationships.list.filters.get('filter').toJS(), order: 'order', searchTerm: '' }));

      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
    });
  });

  describe('resetSearch', () => {
    it('should set term and filters to blank state', async () => {
      await actions.resetSearch()(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith('change: relationships/list/search.searchTerm with: empty');

      expect(dispatch.calls.argsFor(1)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(1)[0].value.toJS()).toEqual({});

      expect(_referencesAPI.default.search).toHaveBeenCalledWith(
      new _RequestParams.RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' }));

      expect(dispatch).toHaveBeenCalledWith({ type: 'relationships/list/searchResults/SET', value: 'searchResults' });
    });
  });

  describe('switchView', () => {
    it('should set view to passed type', () => {
      actions.switchView('specificType')(dispatch, getState);
      expect(dispatch.calls.argsFor(0)[0].type).toBe('relationships/list/view/SET');
      expect(dispatch.calls.argsFor(0)[0].value).toBe('specificType');
    });

    describe('When type is grpah', () => {
      it('should load all references', done => {
        actions.switchView('graph')(dispatch, getState).
        then(() => {
          checkLoadAllReferences(done, 1);
        });
      });
    });
  });
});