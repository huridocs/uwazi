import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/RelationTypes/actions/relationTypesActions';
import * as types from 'app/RelationTypes/actions/actionTypes';

describe('relationTypesActions', () => {
  describe('editRelationType', () => {
    it('should return an EDIT_RELATION_TYPE action ', () => {
      let relationType = {name: 'Secret list of things', values: []};
      let action = actions.editRelationType(relationType);
      expect(action).toEqual({type: types.EDIT_RELATION_TYPE, relationType});
    });
  });

  describe('setRelationTypes', () => {
    it('should return an SET_RELATION_TYPES action ', () => {
      let relationTypes = [{name: 'Secret list of things', values: []}];
      let action = actions.setRelationTypes(relationTypes);
      expect(action).toEqual({type: types.SET_RELATION_TYPES, relationTypes});
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'relationtypes?_id=relationTypeId', 'delete', {body: JSON.stringify({testBackendResult: 'ok'})});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('deleteRelationType', () => {
      it('should delete the relationType and dispatch a RELATION_TYPE_DELETED action with the id', (done) => {
        let relationType = {_id: 'relationTypeId'};
        actions.deleteRelationType(relationType)(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.RELATION_TYPE_DELETED, id: 'relationTypeId'});
          done();
        });
      });
    });
  });
});
