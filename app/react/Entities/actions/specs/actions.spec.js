import * as actions from '../actions';
import * as Notifications from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';

import {fromJS as Immutable} from 'immutable';

import api from 'app/Entities/EntitiesAPI';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('Entities actions', () => {
  let dispatch;
  let getState;
  let groupedConnections;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    getState = () => {
      return {
        templates: 'templates',
        entityView: {entity: Immutable({sharedId: 'sid'}), sort: {order: 'order'}, filters: Immutable({filter: 'filter'})}
      };
    };

    groupedConnections = [
      {templates: [{_id: 't1'}]},
      {templates: [{_id: 't2'}, {_id: 't3'}]}
    ];

    spyOn(api, 'save').and.returnValue(Promise.resolve({_id: 'newId', _rev: 'newRev'}));
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(api, 'deleteMultiple').and.returnValue(Promise.resolve());
    spyOn(refenrecesAPI, 'delete').and.returnValue(Promise.resolve());
    spyOn(refenrecesAPI, 'search').and.returnValue(Promise.resolve('searchResults'));
    spyOn(refenrecesAPI, 'getGroupedByConnection').and.returnValue(Promise.resolve(groupedConnections));
    spyOn(prioritySortingCriteria, 'get').and.returnValue(Promise.resolve('prioritySorting'));
    spyOn(Notifications, 'notify').and.returnValue('NOTIFIED');
    spyOn(formActions, 'merge').and.callFake((scope, sort) => 'merge: ' + scope + ' with: ' + sort);
    spyOn(formActions, 'change').and.callFake((scope, sort) => 'change: ' + scope + ' with: ' + (sort || 'empty'));
  });

  describe('saveEntity', () => {
    it('should dispatch a saving entity and save the data', (done) => {
      actions.saveEntity('data')(dispatch)
      .then(() => {
        expect(api.save).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Entity saved', 'success');
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/entity/SET', value: {_id: 'newId', _rev: 'newRev'}});
        expect(dispatch).toHaveBeenCalledWith({type: 'rrf/reset', model: 'entityView.entityForm'});
        done();
      });
    });
  });

  describe('deleteEntity', () => {
    it('should delete the entity and notify', (done) => {
      actions.deleteEntity('data')(dispatch)
      .then(() => {
        expect(api.delete).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Entity deleted', 'success');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteEntities', () => {
    it('should delete the entities and notify', (done) => {
      actions.deleteEntities(['entity1', 'entity2'])(dispatch)
      .then(() => {
        expect(api.deleteMultiple).toHaveBeenCalledWith(['entity1', 'entity2']);
        expect(Notifications.notify).toHaveBeenCalledWith('Deletion success', 'success');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('searchReferences', () => {
    it('should fetch the references with the current state filters, sorting and empty text by default', (done) => {
      actions.searchReferences()(dispatch, getState)
      .then(() => {
        expect(refenrecesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});
        expect(dispatch).toHaveBeenCalledWith({type: 'SHOW_TAB', tab: 'references'});
        done();
      });
    });

    it('should fetch the references with custom text search', (done) => {
      getState = () => {
        return {entityView: {entity: Immutable({sharedId: 'sid'}), sort: {}, filters: Immutable({}), search: {searchTerm: {value: 'term'}}}};
      };
      actions.searchReferences()(dispatch, getState)
      .then(() => {
        expect(refenrecesAPI.search).toHaveBeenCalledWith('sid', {searchTerm: 'term'});
        done();
      });
    });
  });

  describe('rerferencesChanged', () => {
    it('should reasssign referencesGroup, sorting criteria, and call on search again', (done) => {
      actions.referencesChanged()(dispatch, getState)
      .then(() => {
        expect(refenrecesAPI.getGroupedByConnection).toHaveBeenCalledWith('sid');
        expect(prioritySortingCriteria.get).toHaveBeenCalledWith({
          currentCriteria: {order: 'order'},
          filteredTemplates: ['t1', 't2', 't3' ],
          templates: 'templates'
        });

        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/referenceGroups/SET', value: groupedConnections});
        expect(dispatch).toHaveBeenCalledWith('merge: entityView.sort with: prioritySorting');
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('deleteReference', () => {
    it('should delete the reference and triger a referencesChanged action', (done) => {
      actions.deleteReference('data')(dispatch, getState)
      .then(() => {
        expect(refenrecesAPI.delete).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Connection deleted', 'success');
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/referenceGroups/SET', value: groupedConnections});
        expect(dispatch).toHaveBeenCalledWith('merge: entityView.sort with: prioritySorting');
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('loadMoreReferences', () => {
    it('should set the limit to the passed parameter', (done) => {
      actions.loadMoreReferences(60)(dispatch, getState)
      .then(() => {
        expect(dispatch.calls.argsFor(0)[0].type).toBe('entityView/filters/SET');
        expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({filter: 'filter', limit: 60});

        expect(refenrecesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('setFilter', () => {
    it('should merge the passed filter to the exisiting filters', (done) => {
      getState = () => {
        return {
          templates: 'templates',
          entityView: {
            entity: Immutable({sharedId: 'sid'}),
            sort: {order: 'order'},
            filters: Immutable({filter: Immutable({oldProperty: 'old', modifiedProperty: 'original'})})
          }
        };
      };

      actions.setFilter({modifiedProperty: 'modified'})(dispatch, getState)
      .then(() => {
        expect(dispatch.calls.argsFor(0)[0].type).toBe('entityView/filters/SET');
        expect(dispatch.calls.argsFor(0)[0].value.toJS()).toEqual({filter: {oldProperty: 'old', modifiedProperty: 'modified'}});

        expect(refenrecesAPI.search).toHaveBeenCalledWith(
          'sid',
          {filter: getState().entityView.filters.get('filter').toJS(), order: 'order', searchTerm: ''}
        );
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});
        done();
      });
    });
  });

  describe('resetSearch', () => {
    it('should set term and filters to blank state', (done) => {
      actions.resetSearch()(dispatch, getState)
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith('change: entityView/search.searchTerm with: empty');

        expect(dispatch.calls.argsFor(1)[0].type).toBe('entityView/filters/SET');
        expect(dispatch.calls.argsFor(1)[0].value.toJS()).toEqual({});

        expect(refenrecesAPI.search).toHaveBeenCalledWith('sid', {filter: 'filter', order: 'order', searchTerm: ''});
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/searchResults/SET', value: 'searchResults'});

        done();
      });
    });
  });
});
