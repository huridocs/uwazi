import * as actions from '../actions';
import * as Notifications from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';

import {fromJS as Immutable} from 'immutable';

import referencesAPI from 'app/Viewer/referencesAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('ConnectionsList actions', () => {
  let dispatch;
  let getState;
  let groupedConnections;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    getState = () => {
      return {
        templates: 'templates',
        entityView: {entity: Immutable({sharedId: 'sid'})},
        connectionsList: {entityId: 'sid', sort: {order: 'order'}, filters: Immutable({filter: 'filter'})}
      };
    };

    groupedConnections = [
      {templates: [{_id: 't1'}]},
      {templates: [{_id: 't2'}, {_id: 't3'}]}
    ];

    spyOn(referencesAPI, 'search').and.returnValue(Promise.resolve('searchResults'));
    spyOn(referencesAPI, 'delete').and.returnValue(Promise.resolve());
    spyOn(referencesAPI, 'getGroupedByConnection').and.returnValue(Promise.resolve(groupedConnections));
    spyOn(prioritySortingCriteria, 'get').and.returnValue(Promise.resolve('prioritySorting'));
    spyOn(Notifications, 'notify').and.returnValue('NOTIFIED');
    spyOn(formActions, 'merge').and.callFake((scope, sort) => 'merge: ' + scope + ' with: ' + sort);
    spyOn(formActions, 'change').and.callFake((scope, sort) => 'change: ' + scope + ' with: ' + (sort || 'empty'));
  });

  describe('searchReferences', () => {
    it('should fetch the connections with the current state filters, sorting and empty text by default', (done) => {
      actions.searchReferences()(dispatch, getState)
      .then(() => {
        expect(referencesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});
        expect(dispatch).toHaveBeenCalledWith({type: 'SHOW_TAB', tab: 'connections'});
        done();
      });
    });

    it('should fetch the connections with custom text search', (done) => {
      getState = () => {
        return {connectionsList: {entityId: 'sid', sort: {}, filters: Immutable({}), search: {searchTerm: {value: 'term'}}}};
      };
      actions.searchReferences()(dispatch, getState)
      .then(() => {
        expect(referencesAPI.search).toHaveBeenCalledWith('sid', {searchTerm: 'term'});
        done();
      });
    });
  });

  describe('connectionsChanged', () => {
    it('should reasssign connectionsGroup, sorting criteria, and call on search again', (done) => {
      actions.connectionsChanged()(dispatch, getState)
      .then(() => {
        expect(referencesAPI.getGroupedByConnection).toHaveBeenCalledWith('sid');
        expect(prioritySortingCriteria.get).toHaveBeenCalledWith({
          currentCriteria: {order: 'order'},
          filteredTemplates: ['t1', 't2', 't3' ],
          templates: 'templates'
        });

        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/connectionsGroups/SET', value: groupedConnections});
        expect(dispatch).toHaveBeenCalledWith('merge: connectionsList.sort with: prioritySorting');
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('deleteConnection', () => {
    it('should delete the connection and triger a connectionsChanged action', (done) => {
      actions.deleteConnection('data')(dispatch, getState)
      .then(() => {
        expect(referencesAPI.delete).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Connection deleted', 'success');
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/connectionsGroups/SET', value: groupedConnections});
        expect(dispatch).toHaveBeenCalledWith('merge: connectionsList.sort with: prioritySorting');
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('loadMoreReferences', () => {
    it('should set the limit to the passed parameter', (done) => {
      actions.loadMoreReferences(null, 60)(dispatch, getState)
      .then(() => {
        expect(dispatch.calls.argsFor(0)[0].type).toBe('connectionsList/filters/SET');
        expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({filter: 'filter', limit: 60});

        expect(referencesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('setFilter', () => {
    it('should merge the passed filter to the exisiting filters', (done) => {
      getState = () => {
        return {
          templates: 'templates',
          connectionsList: {
            entityId: 'sid',
            sort: {order: 'order'},
            filters: Immutable({filter: Immutable({oldProperty: 'old', modifiedProperty: 'original'})})
          }
        };
      };

      actions.setFilter({modifiedProperty: 'modified'})(dispatch, getState)
      .then(() => {
        expect(dispatch.calls.argsFor(0)[0].type).toBe('connectionsList/filters/SET');
        expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({filter: {oldProperty: 'old', modifiedProperty: 'modified'}});

        expect(referencesAPI.search).toHaveBeenCalledWith(
          'sid',
          {filter: getState().connectionsList.filters.get('filter').toJS(), order: 'order', searchTerm: ''}
        );
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('resetSearch', () => {
    it('should set term and filters to blank state', (done) => {
      actions.resetSearch()(dispatch, getState)
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith('change: connectionsList/search.searchTerm with: empty');

        expect(dispatch.calls.argsFor(1)[0].type).toBe('connectionsList/filters/SET');
        expect(dispatch.calls.argsFor(1)[0].value.toJS()).toEqual({});

        expect(referencesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'searchResults'});

        done();
      });
    });
  });
});
