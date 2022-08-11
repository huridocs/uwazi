/* eslint-disable max-nested-callbacks */
import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';

import referencesAPI from 'app/Viewer/referencesAPI';
import * as modalActions from 'app/Modals/actions/modalActions';
import * as actions from 'app/RelationTypes/actions/relationTypesActions';

describe('relationTypesActions', () => {
  describe('editRelationType', () => {
    it('should load the relationType in the form model', () => {
      const relationType = { name: 'Secret list of things', values: [] };
      expect(actions.editRelationType(relationType)).toMatchSnapshot();
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      backend.restore();
      backend.delete(`${APIURL}relationtypes?_id=relationTypeId`, {
        body: JSON.stringify({ testBackendResult: 'ok' }),
      });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => backend.restore());

    describe('deleteRelationType', () => {
      it('should delete the relationType and dispatch a relationTypes/REMOVE action with the relation type', done => {
        const relationType = { _id: 'relationTypeId' };
        actions
          .deleteRelationType(relationType)(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({
              type: 'relationTypes/REMOVE',
              value: relationType,
            });
            done();
          });
      });
    });

    describe('checkRelationTypeCanBeDeleted', () => {
      let relationType;
      beforeEach(() => {
        spyOn(modalActions, 'showModal');
        relationType = { _id: 'abc1' };
      });

      describe('when there is references using the relation type', () => {
        it('should showModal CantDeleteRelationType', done => {
          spyOn(referencesAPI, 'countByRelationType').and.callFake(async () => Promise.resolve(2));

          actions
            .checkRelationTypeCanBeDeleted(relationType)(dispatch)
            .then(() => {
              expect('this promise to not be rejected').toBe(false);
              done();
            })
            .catch(() => {
              done();
            });
        });
      });

      describe('when there is not references using the relation type', () => {
        it('should return a rejected promise', done => {
          spyOn(referencesAPI, 'countByRelationType').and.callFake(async () => Promise.resolve(0));

          actions
            .checkRelationTypeCanBeDeleted(relationType)(dispatch)
            .then(() => {
              done();
            })
            .catch(() => {
              expect('this promise to be rejected').toBe(false);
              done();
            });
        });
      });
    });
  });
});
