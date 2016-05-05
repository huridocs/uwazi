import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {mockID} from 'app/utils/uniqueID.js';
import {APIURL} from 'app/config.js';
import * as actions from 'app/Viewer/actions/referencesActions';
import * as types from 'app/Viewer/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('referencesActions', () => {
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      let action = actions.setReferences('references');
      expect(action).toEqual({type: types.SET_REFERENCES, references: 'references'});
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
      backend.restore();
      backend
      .mock(APIURL + 'references', 'POST', {body: JSON.stringify({id: 'createdID'})});
    });

    describe('saveReference', () => {
      it('should save the reference, on success add it and dispatch a success notification', (done) => {
        let reference = {reference: 'reference'};

        const expectedActions = [
          {type: types.ADD_CREATED_REFERENCE, reference: {reference: 'reference', _id: 'createdID'}},
          {type: notificationsTypes.NOTIFY, notification: {message: 'saved successfully !', type: 'success', id: 'unique_id'}}
        ];

        const store = mockStore({});

        store.dispatch(actions.saveReference(reference))
        .then(() => {
          expect(backend.lastOptions().body).toEqual(JSON.stringify({reference: 'reference'}));
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
