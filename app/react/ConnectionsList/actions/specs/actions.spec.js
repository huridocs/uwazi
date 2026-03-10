import { fromJS as Immutable } from 'immutable';
import { actions as formActions } from 'react-redux-form';

import { notificationActions } from 'app/Notifications';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import referencesAPI from 'app/Viewer/referencesAPI';
import { RequestParams } from 'app/utils/RequestParams';

import * as actions from '../actions';

describe('ConnectionsList actions', () => {
  let dispatch;
  let getState;
  let groupedConnections;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    getState = () => ({
      templates: 'templates',
      entityView: { entity: Immutable({ sharedId: 'sid' }) },
      relationships: {
        list: {
          sharedId: 'sid',
          sort: { order: 'order' },
          filters: Immutable({ filter: 'filter' }),
        },
      },
    });

    groupedConnections = [
      { templates: [{ _id: 't1' }] },
      { templates: [{ _id: 't2' }, { _id: 't3' }] },
    ];

    spyOn(referencesAPI, 'search').and.callFake(async () => Promise.resolve('searchResults'));
    spyOn(referencesAPI, 'delete').and.callFake(async () => Promise.resolve());
    spyOn(referencesAPI, 'getGroupedByConnection').and.returnValue(
      Promise.resolve(groupedConnections)
    );
    spyOn(prioritySortingCriteria, 'get').and.callFake(async () =>
      Promise.resolve('prioritySorting')
    );
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
    spyOn(formActions, 'merge').and.callFake((scope, sort) => `merge: ${scope} with: ${sort}`);
    spyOn(formActions, 'change').and.callFake(
      (scope, sort) => `change: ${scope} with: ${sort || 'empty'}`
    );
  });

  function checkLoadAllReferences(done, argPos = 0) {
    expect(dispatch.calls.argsFor(argPos)[0].type).toBe('relationships/list/filters/SET');
    expect(dispatch.calls.argsFor(argPos)[0].value.toJS()).toEqual({
      filter: 'filter',
      limit: 9999,
    });

    expect(referencesAPI.search).toHaveBeenCalledWith(
      new RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: 'relationships/list/searchResults/SET',
      value: 'searchResults',
    });
    done();
  }

  describe('searchReferences', () => {
    it('should fetch the connections with the current state filters, sorting and empty text by default', async () => {
      await actions.searchReferences()(dispatch, getState);
      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({
          sharedId: 'sid',
          filter: 'filter',
          order: 'order',
          searchTerm: '',
        })
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
    });

    it('should fetch the connections with the default state when filters is undefined', async () => {
      getState = () => ({
        templates: 'templates',
        entityView: { entity: Immutable({ sharedId: 'sid' }) },
        relationships: {
          list: { sharedId: 'sid', sort: { order: 'order' } },
        },
      });

      await actions.searchReferences()(dispatch, getState);

      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({ sharedId: 'sid', order: 'order' })
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
    });

    it('should fetch the connections with custom text search', async () => {
      getState = () => ({
        relationships: {
          list: {
            sharedId: 'sid',
            sort: {},
            filters: Immutable({}),
            search: {
              searchTerm: {
                value: 'term',
              },
            },
          },
        },
      });
      await actions.searchReferences()(dispatch, getState);

      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({ sharedId: 'sid', searchTerm: 'term' })
      );
    });
  });

  describe('connectionsChanged', () => {
    it('should reasssign connectionsGroup, sorting criteria, and call on search again', done => {
      actions
        .connectionsChanged()(dispatch, getState)
        .then(() => {
          expect(referencesAPI.getGroupedByConnection).toHaveBeenCalledWith(
            new RequestParams({ sharedId: 'sid' })
          );
          expect(prioritySortingCriteria.get).toHaveBeenCalledWith({
            currentCriteria: { order: 'order' },
            filteredTemplates: ['t1', 't2', 't3'],
            templates: 'templates',
          });

          expect(dispatch).toHaveBeenCalledWith({
            type: 'relationships/list/connectionsGroups/SET',
            value: groupedConnections,
          });
          expect(dispatch).toHaveBeenCalledWith(
            'merge: relationships/list.sort with: prioritySorting'
          );
          expect(dispatch).toHaveBeenCalledWith({
            type: 'relationships/list/searchResults/SET',
            value: 'searchResults',
          });
          done();
        });
    });
  });

  describe('deleteConnection', () => {
    it('should delete the connection and triger a connectionsChanged action', async () => {
      await actions.deleteConnection({ _id: 'id', key: 'value' })(dispatch, getState);

      expect(referencesAPI.delete).toHaveBeenCalledWith(new RequestParams({ _id: 'id' }));
      expect(notificationActions.notify).toHaveBeenCalledWith('Connection deleted', 'success');
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/connectionsGroups/SET',
        value: groupedConnections,
      });
      expect(dispatch).toHaveBeenCalledWith('merge: relationships/list.sort with: prioritySorting');
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
    });
  });

  describe('loadAllReferences', () => {
    it('should set the limit 9999', done => {
      actions
        .loadAllReferences()(dispatch, getState)
        .then(() => {
          checkLoadAllReferences(done);
        });
    });
  });

  describe('loadMoreReferences', () => {
    it('should set the limit to the passed parameter', async () => {
      await actions.loadMoreReferences(60)(dispatch, getState);

      expect(dispatch.calls.argsFor(0)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({ filter: 'filter', limit: 60 });

      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' })
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
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
            filters: Immutable({
              filter: Immutable({ oldProperty: 'old', modifiedProperty: 'original' }),
            }),
          },
        },
      });

      await actions.setFilter({ modifiedProperty: 'modified' })(dispatch, getState);
      expect(dispatch.calls.argsFor(0)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({
        filter: { oldProperty: 'old', modifiedProperty: 'modified' },
      });

      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({
          sharedId: 'sid',
          filter: getState().relationships.list.filters.get('filter').toJS(),
          order: 'order',
          searchTerm: '',
        })
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
    });
  });

  describe('resetSearch', () => {
    it('should set term and filters to blank state', async () => {
      await actions.resetSearch()(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(
        'change: relationships/list/search.searchTerm with: empty'
      );

      expect(dispatch.calls.argsFor(1)[0].type).toBe('relationships/list/filters/SET');
      expect(dispatch.calls.argsFor(1)[0].value.toJS()).toEqual({});

      expect(referencesAPI.search).toHaveBeenCalledWith(
        new RequestParams({ sharedId: 'sid', filter: 'filter', order: 'order', searchTerm: '' })
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: 'relationships/list/searchResults/SET',
        value: 'searchResults',
      });
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
        actions
          .switchView('graph')(dispatch, getState)
          .then(() => {
            checkLoadAllReferences(done, 1);
          });
      });
    });
  });
});
