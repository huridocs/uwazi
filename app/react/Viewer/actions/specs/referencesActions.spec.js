/**
 * @jest-environment jsdom
 */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import Immutable from 'immutable';

import { mockID } from 'shared/uniqueID.js';
import { APIURL } from 'app/config.js';
import * as connectionsActions from 'app/Connections/actions/actions';
import { actions as relationshipsActions } from 'app/Relationships';
import * as actions from 'app/Viewer/actions/referencesActions';
import * as types from 'app/Viewer/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import referencesAPI from 'app/Viewer/referencesAPI';
import scroller from 'app/Viewer/utils/Scroller';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Viewer referencesActions', () => {
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      const action = actions.setReferences('references');
      expect(action).toEqual({ type: types.SET_REFERENCES, references: 'references' });
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      mockID();
      spyOn(scroller, 'to');
      backend.restore();
      backend.delete(`${APIURL}references?_id=bcd`, { body: JSON.stringify({ _id: 'reference' }) });
      spyOn(relationshipsActions, 'reloadRelationships').and.callFake(entityId => ({
        type: 'reloadRelationships',
        entityId,
      }));
    });

    afterEach(() => backend.restore());

    describe('loadReferences', () => {
      beforeEach(() => {
        spyOn(referencesAPI, 'get').and.callFake(requestParams =>
          Promise.resolve(`${requestParams.data.sharedId}References`)
        );
      });

      it('should fetch document references and dispatch SET_REFERENCES with result', done => {
        const store = mockStore({});
        actions
          .loadReferences('document1')(store.dispatch)
          .then(() => {
            expect(store.getActions()).toEqual([
              { type: 'SET_REFERENCES', references: 'document1References' },
            ]);
            done();
          });
      });
    });

    describe('addReference', () => {
      let getState;
      let store;
      let references;

      beforeEach(() => {
        store = mockStore({});
        getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: { referencedDocuments: Immutable.fromJS([{ _id: '1' }]) },
          relationships: { list: { sharedId: 'docId' } },
        });
        references = {
          saves: [
            {
              _id: 'addedReference1',
              file: 'entityfileId',
              reference: { text: 'reference' },
              sourceRange: { text: 'Text' },
            },
            { _id: 'addedReference2', reference: { text: 'reference' } },
          ],
          deletions: [],
        };
      });

      it('should add the reference and reload relationships', () => {
        let expectedActions = [
          { type: types.ADD_REFERENCE, reference: references.saves[1] },
          { type: types.ADD_REFERENCE, reference: references.saves[0] },
          { type: 'viewer/targetDoc/UNSET' },
          { type: 'viewer/targetDocHTML/UNSET' },
          { type: 'viewer/targetDocReferences/UNSET' },
          { type: 'reloadRelationships', entityId: 'docId' },
          { type: types.DEACTIVATE_REFERENCE },
          { type: types.ACTIVE_REFERENCE, reference: 'addedReference1' },
          {
            type: types.SET_SELECTION,
            sourceFile: 'entityfileId',
            sourceRange: { selectionRectangles: undefined, text: 'reference' },
          },
          { type: 'GO_TO_ACTIVE', value: true },
          { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
          { type: 'viewer.sidepanel.tab/SET', value: 'references' },
        ];

        actions.addReference(references, true)(store.dispatch, getState);
        expect(store.getActions()).toEqual(expectedActions);

        store.clearActions();

        expectedActions = [
          { type: types.ADD_REFERENCE, reference: references.saves[1] },
          { type: types.ADD_REFERENCE, reference: references.saves[0] },
          { type: 'viewer/targetDoc/UNSET' },
          { type: 'viewer/targetDocHTML/UNSET' },
          { type: 'viewer/targetDocReferences/UNSET' },
          { type: 'reloadRelationships', entityId: 'docId' },
          { type: types.DEACTIVATE_REFERENCE },
          { type: types.ACTIVE_REFERENCE, reference: 'addedReference1' },
          {
            type: types.SET_SELECTION,
            sourceFile: 'entityfileId',
            sourceRange: { selectionRectangles: undefined, text: 'reference' },
          },
          { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
          { type: 'viewer.sidepanel.tab/SET', value: 'references' },
        ];

        actions.addReference(references, false)(store.dispatch, getState);
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('saveTargetRangedReference', () => {
      let store;
      const getState = {};
      let saveConnectionDispatch;
      let connection;
      let targetRange;
      let onCreate;

      beforeEach(() => {
        saveConnectionDispatch = jasmine
          .createSpy('saveConnectionDispatch')
          .and.returnValue('returnValue');
        // eslint-disable-next-line no-import-assign
        connectionsActions.saveConnection = jasmine
          .createSpy('saveConnection')
          .and.returnValue(saveConnectionDispatch);
        store = mockStore({});
        connection = { sourceDocument: 'sourceId' };
        targetRange = { text: 'target text' };
        onCreate = () => {};
      });

      it('should unset the targetDocReferences', () => {
        const returnValue = actions.saveTargetRangedReference(
          connection,
          targetRange,
          'fileId',
          onCreate
        )(store.dispatch, getState);

        expect(store.getActions()).toContainEqual({ type: 'viewer/targetDocReferences/UNSET' });
        expect(connectionsActions.saveConnection).toHaveBeenCalledWith(
          {
            sourceDocument: 'sourceId',
            targetRange: { text: 'target text' },
            targetFile: 'fileId',
          },
          onCreate
        );
        expect(saveConnectionDispatch).toHaveBeenCalledWith(store.dispatch, getState);
        expect(returnValue).toBe('returnValue');
      });

      it('should not act if targetRange empty', () => {
        targetRange.text = '';
        const returnValue = actions.saveTargetRangedReference(
          connection,
          targetRange,
          onCreate
        )(store.dispatch);
        expect(store.getActions().length).toBe(0);
        expect(returnValue).toBeUndefined();
      });
    });

    describe('deleteReference', () => {
      it("should delete the reference's associated relationship and reload relationships", done => {
        const reference = { _id: 'abc', associatedRelationship: { _id: 'bcd' } };

        const expectedActions = [
          { type: 'reloadRelationships', entityId: 'docId' },
          { type: types.REMOVE_REFERENCE, reference },
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Connection deleted', type: 'success', id: 'unique_id' },
          },
        ];

        const store = mockStore({});
        const getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: { referencedDocuments: Immutable.fromJS([{ _id: '1' }]) },
          relationships: { list: { sharedId: 'docId' } },
        });

        actions
          .deleteReference(reference)(store.dispatch, getState)
          .then(() => {
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });
  });
});
