import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import Immutable from 'immutable';

import {mockID} from 'shared/uniqueID.js';
import {APIURL} from 'app/config.js';
import * as actions from 'app/Viewer/actions/referencesActions';
import * as types from 'app/Viewer/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import scroller from 'app/Viewer/utils/Scroller';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('referencesActions', () => {
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      let action = actions.setReferences('references');
      expect(action).toEqual({type: types.SET_REFERENCES, references: 'references'});
    });
  });
  describe('setRelationType()', () => {
    it('should return a SET_RELATION_TYPE type with the type', () => {
      let action = actions.setRelationType('type');
      expect(action).toEqual({type: types.SET_RELATION_TYPE, relationType: 'type'});
    });
  });
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      let action = actions.setReferences('references');
      expect(action).toEqual({type: types.SET_REFERENCES, references: 'references'});
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      mockID();
      spyOn(scroller, 'to');
      backend.restore();
      backend
      .mock(APIURL + 'references', 'POST', {body: JSON.stringify({_id: 'referenceCreated'})})
      .mock(APIURL + 'references?_id=abc', 'DELETE', {body: JSON.stringify({_id: 'reference'})})
      .mock(APIURL + 'documents/list?keys=%5B2%5D', 'GET', {body: JSON.stringify({rows: [{_id: '2'}]})});
    });

    describe('saveReference', () => {
      it('should save the reference, on success add it and dispatch a success notification', (done) => {
        let reference = {reference: 'reference', targetDocument: 2};

        const expectedActions = [
          {type: types.ADD_CREATED_REFERENCE, reference: {_id: 'referenceCreated'}},
          {type: 'viewer/targetDoc/UNSET'},
          {type: 'viewer/targetDocHTML/UNSET'},
          {type: 'ACTIVE_REFERENCE', reference: 'referenceCreated'},
          {type: 'OPEN_PANEL', panel: 'viewReferencesPanel'},
          {type: notificationsTypes.NOTIFY, notification: {message: 'saved successfully !', type: 'success', id: 'unique_id'}},
          {type: 'viewer/referencedDocuments/SET', value: [{_id: '1'}, {_id: '2'}]}
        ];

        const store = mockStore({});
        let getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: {referencedDocuments: Immutable.fromJS([{_id: '1'}])}
        });
        actions.saveReference(reference)(store.dispatch, getState)
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('deleteReference', () => {
      it('should delete the reference and dispatch a success notification', (done) => {
        let reference = {_id: 'abc'};

        const expectedActions = [
          {type: types.REMOVE_REFERENCE, reference: reference},
          {type: notificationsTypes.NOTIFY, notification: {message: 'Connection deleted', type: 'success', id: 'unique_id'}}
        ];

        const store = mockStore({});
        let getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: {referencedDocuments: Immutable.fromJS([{_id: '1'}])}
        });
        actions.deleteReference(reference)(store.dispatch, getState)
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
