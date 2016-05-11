import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';
import {actions as formActions} from 'react-redux-form';

import referencesAPI from 'app/Viewer/referencesAPI';
import * as modalActions from 'app/Modals/actions/modalActions';
import * as actions from 'app/RelationTypes/actions/relationTypesActions';
import * as types from 'app/RelationTypes/actions/actionTypes';

describe('relationTypesActions', () => {
  describe('editRelationType', () => {
    it('should load the relationType in the form model', () => {
      let relationType = {name: 'Secret list of things', values: []};
      spyOn(formActions, 'load').and.returnValue('RELATION_TYPE_LOADED');
      let dispatch = jasmine.createSpy('dispatch');
      actions.editRelationType(relationType)(dispatch);

      expect(formActions.load).toHaveBeenCalledWith('relationType', relationType);
      expect(dispatch).toHaveBeenCalledWith('RELATION_TYPE_LOADED');
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

    describe('checkRelationTypeCanBeDeleted', () => {
      let relationType;
      beforeEach(() => {
        spyOn(modalActions, 'showModal');
        relationType = {_id: 'abc1'};
      });

      describe('when there is references using the relation type', () => {
        it('should showModal CantDeleteRelationType', (done) => {
          spyOn(referencesAPI, 'countByRelationType').and.returnValue(Promise.resolve(2));

          actions.checkRelationTypeCanBeDeleted(relationType)(dispatch)
          .then(() => {
            expect(modalActions.showModal).toHaveBeenCalledWith('CantDeleteRelationType', 2);
            done();
          });
        });
      });

      describe('when there is not references using the relation type', () => {
        it('should showModal DeleteRelationTypeConfirm', (done) => {
          spyOn(referencesAPI, 'countByRelationType').and.returnValue(Promise.resolve(0));

          actions.checkRelationTypeCanBeDeleted(relationType)(dispatch)
          .then(() => {
            expect(modalActions.showModal).toHaveBeenCalledWith('DeleteRelationTypeConfirm', relationType);
            done();
          });
        });
      });
    });
  });
});
