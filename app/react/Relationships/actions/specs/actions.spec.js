import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import {fromJS as Immutable} from 'immutable';
import {mockID} from 'shared/uniqueID.js';

import api from 'app/utils/api';
import * as types from '../actionTypes';
import * as actions from '../actions';

import * as routeUtils from '../../utils/routeUtils';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Relationships actions', () => {
  describe('parseResults', () => {
    it('should pass action with results, parentEntity and editing boolean value', () => {
      expect(actions.parseResults('results', 'parentEntity', true))
      .toEqual({type: types.PARSE_RELATIONSHIPS_RESULTS, results: 'results', parentEntity: 'parentEntity', editing: true});
    });
  });

  describe('edit', () => {
    it('should pass action with value, results, parentEntity, editing boolean value', () => {
      expect(actions.edit(true, 'results', 'parentEntity'))
      .toEqual({type: types.EDIT_RELATIONSHIPS, value: true, results: 'results', parentEntity: 'parentEntity', editing: true});
    });
  });

  describe('addHub', () => {
    it('should pass action', () => {
      expect(actions.addHub()).toEqual({type: types.ADD_RELATIONSHIPS_HUB});
    });
  });

  describe('toggelRemoveLeftRelationship', () => {
    it('should pass action with index', () => {
      expect(actions.toggelRemoveLeftRelationship(3)).toEqual({type: types.TOGGLE_REMOVE_RELATIONSHIPS_LEFT, index: 3});
    });
  });

  describe('toggleRemoveRightRelationshipGroup', () => {
    it('should pass action with index and rightIndex', () => {
      expect(actions.toggleRemoveRightRelationshipGroup(3, 7))
      .toEqual({type: types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP, index: 3, rightIndex: 7});
    });
  });

  describe('updateLeftRelationshipType', () => {
    it('should pass action with index and id', () => {
      expect(actions.updateLeftRelationshipType(3, 'id'))
      .toEqual({type: types.UPDATE_RELATIONSHIPS_LEFT_TYPE, index: 3, _id: 'id'});
    });
  });

  describe('setAddToData', () => {
    it('should pass action with index and id', () => {
      expect(actions.setAddToData(3, 7))
      .toEqual({type: types.SET_RELATIONSHIPS_ADD_TO_DATA, index: 3, rightIndex: 7});
    });
  });

  describe('updateRightRelationshipType', () => {
    it('should UPDATE_RELATIONSHIPS_RIGHT_TYPE passing newRightRelationshipType as false if right index not last', () => {
      const store = mockStore({});
      const getState = () => {
        return {relationships: {hubs: Immutable([0, 1, 2, {rightRelationships: [0, 1, 2, 3, 4, 5, 6, 7]}])}};
      };

      actions.updateRightRelationshipType(3, 5, 'id')(store.dispatch, getState);

      expect(store.getActions())
      .toEqual([{type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, index: 3, rightIndex: 5, _id: 'id', newRightRelationshipType: false}]);
    });

    it('should UPDATE_RELATIONSHIPS_RIGHT_TYPE, addToData and open panel if right index is last', () => {
      const store = mockStore({});
      const getState = () => {
        return {relationships: {hubs: Immutable([0, 1, 2, {rightRelationships: [0, 1, 2, 3, 4, 5, 6, 7]}])}};
      };

      actions.updateRightRelationshipType(3, 7, 'id')(store.dispatch, getState);

      expect(store.getActions()).toEqual([
        {type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE, index: 3, rightIndex: 7, _id: 'id', newRightRelationshipType: true},
        {type: types.SET_RELATIONSHIPS_ADD_TO_DATA, index: 3, rightIndex: 7},
        {type: 'OPEN_RELATIONSHIPS_PANEL'}
      ]);
    });
  });

  describe('addEntity', () => {
    it('should pass action with index, rightIndex and entity', () => {
      expect(actions.addEntity(3, 7, 'entity'))
      .toEqual({type: types.ADD_RELATIONSHIPS_ENTITY, index: 3, rightIndex: 7, entity: 'entity'});
    });
  });

  describe('toggleRemoveEntity', () => {
    it('should pass action with index, rightIndex and entity', () => {
      expect(actions.toggleRemoveEntity(3, 7, 'relIndex'))
      .toEqual({type: types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY, index: 3, rightIndex: 7, relationshipIndex: 'relIndex'});
    });
  });

  describe('reloadRelationships', () => {
    beforeEach(() => {
      spyOn(routeUtils, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults']));
    });

    it('should call on routeUtils and set the LIST results', (done) => {
      const store = mockStore({});
      const templates = 'storeTemplates';
      const getState = () => {
        return {templates};
      };

      actions.reloadRelationships('parentEntityId')(store.dispatch, getState)
      .then(() => {
        expect(routeUtils.requestState).toHaveBeenCalledWith('parentEntityId', templates);
        expect(store.getActions()).toEqual([
          {type: 'relationships/list/connectionsGroups/SET', value: 'connectionsGroups'},
          {type: 'relationships/list/searchResults/SET', value: 'searchResults'}
        ]);
        done();
      });
    });
  });

  describe('saveRelationships', () => {
    let store;
    let hubs;

    function getState() {
      return {
        relationships: {
          list: {
            entityId: 'entityId',
            entity: 'fullEntity',
            searchResults: 'storeSearchResults'
          },
          hubs
        }
      };
    }

    beforeEach(() => {
      store = mockStore({});
      hubs = Immutable([{
        hub: 'hub1',
        leftRelationship: {_id: 'originalLeftRelationship1'},
        rightRelationships: [{
          relationships: [
            {_id: 'originalRightRelationship1', entity: {sharedId: 'o1'}},
            {_id: 'originalRightRelationship2', entity: {sharedId: 'o2'}},
            {_id: 'originalRightRelationship3', entity: {sharedId: 'o3'}}
          ]
        }, {
          relationships: [
            {_id: 'originalRightRelationship4', entity: {sharedId: 'o4'}},
            {_id: 'originalRightRelationship5', entity: {sharedId: 'o5'}},
            {_id: 'originalRightRelationship6', entity: {sharedId: 'o6'}}
          ]
        }]
      }, {
        hub: 'hub2',
        leftRelationship: {_id: 'originalLeftRelationship2'},
        rightRelationships: [{
          relationships: [
            {_id: 'originalRightRelationship7', entity: {sharedId: 'o7'}},
            {_id: 'originalRightRelationship8', entity: {sharedId: 'o8'}},
            {_id: 'originalRightRelationship9', entity: {sharedId: 'o9'}}
          ]
        }, {
          relationships: [
            {_id: 'originalRightRelationship10', entity: {sharedId: 'o10'}},
            {_id: 'originalRightRelationship11', entity: {sharedId: 'o11'}},
            {_id: 'originalRightRelationship12', entity: {sharedId: 'o12'}}
          ]
        }]
      }, {
        hub: 'hub3',
        leftRelationship: {_id: 'originalLeftRelationship3'},
        rightRelationships: [{
          relationships: [
            {_id: 'originalRightRelationship13', entity: {sharedId: 'o13'}},
            {_id: 'originalRightRelationship14', entity: {sharedId: 'o14'}},
            {_id: 'originalRightRelationship15', entity: {sharedId: 'o15'}}
          ]
        }]
      }]);

      spyOn(api, 'post').and.returnValue(Promise.resolve('POSTresponse'));
      spyOn(routeUtils, 'requestState').and.returnValue(Promise.resolve(['reloadedConnectionsGroups', 'reloadedSearchResults']));
      mockID();
    });

    describe('common action dispatches', () => {
      it('should dispatch a saving status, reload relationships lists, close panel, exit edit and broadcast saved and notify', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          expect(store.getActions()).toEqual([
            {type: types.SAVING_RELATIONSHIPS},
            {type: 'relationships/list/connectionsGroups/SET', value: 'reloadedConnectionsGroups'},
            {type: 'relationships/list/searchResults/SET', value: 'reloadedSearchResults'},
            {type: 'CLOSE_RELATIONSHIPS_PANEL'},
            {type: 'EDIT_RELATIONSHIPS', value: false, results: 'storeSearchResults', parentEntity: 'fullEntity', editing: false},
            {type: 'SAVED_RELATIONSHIPS', response: 'POSTresponse'},
            {type: 'NOTIFY', notification: {message: 'Relationships saved', type: 'success', id: 'unique_id'}}
          ]);
          done();
        });
      });
    });

    it('should post to relationship/bluk with empty actions if no changes made', (done) => {
      actions.saveRelationships()(store.dispatch, getState)
      .then(() => {
        expect(api.post).toHaveBeenCalledWith('relationships/bulk', {save: [], delete: []});
        done();
      });
    });

    describe('when changes have taken place', () => {
      beforeEach(() => {
        hubs = hubs.setIn([0, 'rightRelationships', 0, 'modified'], true);
        hubs = hubs.setIn([0, 'rightRelationships', 0, 'relationships', 2, 'deleted'], true);
        hubs = hubs.setIn([0, 'rightRelationships', 1, 'relationships', 1, 'deleted'], true);
        hubs = hubs.setIn([0, 'rightRelationships', 1, 'relationships'],
                          hubs
                          .getIn([0, 'rightRelationships', 1, 'relationships'])
                          .push(Immutable({entity: {sharedId: 'n7'}})));

        hubs = hubs.setIn([1, 'modified'], true);
        hubs = hubs.setIn([1, 'rightRelationships', 0, 'modified'], true);
        hubs = hubs.setIn([1, 'rightRelationships', 0, 'deleted'], true);
        hubs = hubs.setIn([1, 'rightRelationships', 0, 'relationships'],
                          hubs
                          .getIn([1, 'rightRelationships', 0, 'relationships'])
                          .push(Immutable({entity: {sharedId: 'n8'}})));

        hubs = hubs.setIn([2, 'deleted'], true);
        hubs = hubs.setIn([2, 'rightRelationships', 0, 'relationships'],
                          hubs
                          .getIn([2, 'rightRelationships', 0, 'relationships'])
                          .push(Immutable({entity: {sharedId: 'n9'}, deleted: true})));
        hubs = hubs.setIn([2, 'rightRelationships', 0, 'relationships'],
                          hubs
                          .getIn([2, 'rightRelationships', 0, 'relationships'])
                          .push(Immutable({entity: {sharedId: 'n10'}})));

        hubs = hubs.push({
          deleted: true,
          leftRelationship: {keys: 'deletedLeftRelationship'},
          rightRelationships: [{
            relationships: [{keys: 'deletedRightRelationship', entity: {sharedId: 'deleted'}}]
          }]
        });

        hubs = hubs.push({
          leftRelationship: {keys: 'newLeftRelationship1'},
          rightRelationships: [{
            relationships: [{keys: 'newRightRelationship1', entity: {sharedId: '1'}}]
          }]
        });

        hubs = hubs.push({
          leftRelationship: {keys: 'newLeftRelationship2'},
          rightRelationships: [{
            relationships: [
              {keys: 'newRightRelationship2', entity: {sharedId: '2'}},
              {keys: 'newRightRelationship3', deleted: true},
              {keys: 'newRightRelationship4', entity: {sharedId: '4'}}
            ]
          }, {
            deleted: true,
            relationships: [
              {keys: 'newRightRelationship5', deleted: true},
              {keys: 'newRightRelationship6'}
            ]
          }]
        });
      });

      it('should call on bulk', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          expect(api.post.calls.mostRecent().args[0]).toBe('relationships/bulk');
          done();
        });
      });

      it('should handle new hubs, taking into account deleted sections on new hubs', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          expect(api.post.calls.mostRecent().args[1].save).toContain([
            {entity: 'entityId', keys: 'newLeftRelationship1'},
            {keys: 'newRightRelationship1', entity: '1'}
          ]);

          expect(api.post.calls.mostRecent().args[1].save).toContain([
            {entity: 'entityId', keys: 'newLeftRelationship2'},
            {keys: 'newRightRelationship2', entity: '2'},
            {keys: 'newRightRelationship4', entity: '4'}
          ]);

          done();
        });
      });

      it('should handle modifications, taking into account new relationships on existing hubs and deleted relationships / sections', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          expect(api.post.calls.mostRecent().args[1].save).toContain({_id: 'originalRightRelationship1', entity: 'o1', hub: 'hub1'});
          expect(api.post.calls.mostRecent().args[1].save).toContain({_id: 'originalRightRelationship2', entity: 'o2', hub: 'hub1'});
          expect(api.post.calls.mostRecent().args[1].save).toContain({entity: 'n7', hub: 'hub1'});
          expect(api.post.calls.mostRecent().args[1].save).toContain({entity: 'entityId', hub: 'hub2', _id: 'originalLeftRelationship2'});
          expect(api.post.calls.mostRecent().args[1].save).toContain({entity: 'n10', hub: 'hub3'});

          done();
        });
      });

      it('should handle deletions, taking into account new hubs and relationships', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship3'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship5'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship7'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship8'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship9'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalRightRelationship3'});
          expect(api.post.calls.mostRecent().args[1].delete).toContain({_id: 'originalLeftRelationship3'});

          done();
        });
      });

      it('should handle all actions simultaneously', (done) => {
        actions.saveRelationships()(store.dispatch, getState)
        .then(() => {
          const expectedSaves = [
            {_id: 'originalRightRelationship1', entity: 'o1', hub: 'hub1'},
            {_id: 'originalRightRelationship2', entity: 'o2', hub: 'hub1'},
            {entity: 'n7', hub: 'hub1'},
            {entity: 'entityId', hub: 'hub2', _id: 'originalLeftRelationship2'},
            {entity: 'n10', hub: 'hub3'},
            [
              {entity: 'entityId', keys: 'newLeftRelationship1'},
              {keys: 'newRightRelationship1', entity: '1'}
            ],
            [
              {entity: 'entityId', keys: 'newLeftRelationship2'},
              {keys: 'newRightRelationship2', entity: '2'},
              {keys: 'newRightRelationship4', entity: '4'}
            ]
          ];
          const expectedDeletes = [
            {_id: 'originalRightRelationship3'},
            {_id: 'originalRightRelationship5'},
            {_id: 'originalRightRelationship7'},
            {_id: 'originalRightRelationship8'},
            {_id: 'originalRightRelationship9'},
            {_id: 'originalLeftRelationship3'}
          ];

          expect(api.post.calls.mostRecent().args[1].save).toEqual(expectedSaves);
          expect(api.post.calls.mostRecent().args[1].delete).toEqual(expectedDeletes);
          done();
        });
      });
    });
  });

  describe('Search-related actions', () => {
    let store;

    beforeEach(() => {
      store = mockStore({});
      spyOn(api, 'get').and.returnValue(Promise.resolve({json: {rows: [{type: 'entity'}, {type: 'doc'}]}}));
    });

    describe('immidiateSearch', () => {
      it('should search for connections', () => {
        actions.immidiateSearch(store.dispatch, 'term');
        expect(api.get).toHaveBeenCalledWith('search', {searchTerm: 'term', fields: ['title']});
        expect(store.getActions()).toContain({type: 'SEARCHING_RELATIONSHIPS'});
      });

      it('should set the results upon response', (done) => {
        actions.immidiateSearch(store.dispatch, 'term')
        .then(() => {
          const expectedAction = {type: 'relationships/searchResults/SET', value: [{type: 'entity'}, {type: 'doc'}]};
          expect(store.getActions()).toContain(expectedAction);
          done();
        });
      });
    });

    describe('search', () => {
      it('should update the state searchTerm and debounce server searching the term', () => {
        jasmine.clock().install();

        actions.search('term', 'basic')(store.dispatch);
        expect(store.getActions()).toContain({type: 'relationships/searchTerm/SET', value: 'term'});
        expect(api.get).not.toHaveBeenCalled();

        jasmine.clock().tick(400);

        expect(api.get).toHaveBeenCalledWith('search', {searchTerm: 'term', fields: ['title']});
        jasmine.clock().uninstall();
      });
    });
  });

  describe('selectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.selectConnection('connection')).toEqual({type: 'relationships/connection/SET', value: 'connection'});
    });
  });

  describe('unselectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.unselectConnection()).toEqual({type: 'relationships/connection/SET', value: {}});
    });
  });
});
