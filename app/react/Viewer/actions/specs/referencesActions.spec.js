import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import Immutable from 'immutable';

import {mockID} from 'shared/uniqueID.js';
import {APIURL} from 'app/config.js';
import {actions as connectionsActions} from 'app/Connections';
import * as actions from 'app/Viewer/actions/referencesActions';
import * as types from 'app/Viewer/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import scroller from 'app/Viewer/utils/Scroller';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Viewer referencesActions', () => {
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
      backend.mock(APIURL + 'references?_id=abc', 'DELETE', {body: JSON.stringify({_id: 'reference'})});
    });

    describe('addReference', () => {
      let getState;
      let store;
      let reference;

      beforeEach(() => {
        store = mockStore({});
        getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: {referencedDocuments: Immutable.fromJS([{_id: '1'}])}
        });
        reference = {
          _id: 'addedRefernce',
          reference: 'reference',
          sourceRange: {text: 'Text'},
          targetDocument: 2
        };
      });

      it('should add the reference', () => {
        const expectedActions = [
          {type: types.ADD_REFERENCE, reference: reference},
          {type: 'viewer/targetDoc/UNSET'},
          {type: 'viewer/targetDocHTML/UNSET'},
          {type: 'viewer/targetDocReferences/UNSET'},
          {type: 'ACTIVE_REFERENCE', reference: 'addedRefernce'},
          {type: 'OPEN_PANEL', panel: 'viewMetadataPanel'},
          {type: 'SHOW_TAB', tab: 'references'}
        ];

        actions.addReference(reference)(store.dispatch, getState);
        expect(store.getActions()).toEqual(expectedActions);
      });

      it('should open the connections tab if sourceRange text is empty', () => {
        reference.sourceRange.text = '';
        actions.addReference(reference)(store.dispatch, getState);
        expect(store.getActions()).toContain({type: 'SHOW_TAB', tab: 'connections'});
      });
    });

    describe('saveTargetRangedReference', () => {
      let store;
      let saveConnectionDispatch;
      let connection;
      let targetRange;
      let onCreate;

      beforeEach(() => {
        saveConnectionDispatch = jasmine.createSpy('saveConnectionDispatch').and.returnValue('returnValue');
        connectionsActions.saveConnection = jasmine.createSpy('saveConnection').and.returnValue(saveConnectionDispatch);
        store = mockStore({});
        connection = {sourceDocument: 'sourceId'};
        targetRange = {text: 'target text'};
        onCreate = () => {};
      });

      it('should unset the targetDocReferences', () => {
        const returnValue = actions.saveTargetRangedReference(connection, targetRange, onCreate)(store.dispatch);
        expect(store.getActions()).toContain({type: 'viewer/targetDocReferences/UNSET'});
        expect(connectionsActions.saveConnection).toHaveBeenCalledWith({sourceDocument: 'sourceId', targetRange: {text: 'target text'}}, onCreate);
        expect(saveConnectionDispatch).toHaveBeenCalledWith(store.dispatch);
        expect(returnValue).toBe('returnValue');
      });

      it('should not act if targetRange empty', () => {
        targetRange.text = '';
        const returnValue = actions.saveTargetRangedReference(connection, targetRange, onCreate)(store.dispatch);
        expect(store.getActions().length).toBe(0);
        expect(returnValue).toBeUndefined();
      });
    });

    describe('deleteReference', () => {
      it('should delete the reference and dispatch a success notification', (done) => {
        let reference = {_id: 'abc'};

        const expectedActions = [
          {type: types.REMOVE_REFERENCE, reference},
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
