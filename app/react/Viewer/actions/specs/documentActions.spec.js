import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {mockID} from 'shared/uniqueID.js';
import documents from 'app/Documents';
import {APIURL} from 'app/config.js';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import * as actions from '../documentActions';
import * as types from '../actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('documentActions', () => {
  describe('setDocument()', () => {
    it('should return a SET_REFERENCES type action with the document', () => {
      let action = actions.setDocument('document', 'html');
      expect(action).toEqual({type: types.SET_DOCUMENT, document: 'document', html: 'html'});
    });
  });
  describe('resetDocumentViewer()', () => {
    it('should return a RESET_DOCUMENT_VIEWER', () => {
      let action = actions.resetDocumentViewer();
      expect(action).toEqual({type: types.RESET_DOCUMENT_VIEWER});
    });
  });
  describe('loadDefaultViewerMenu()', () => {
    it('should return a LOAD_DEFAULT_VIEWER_MENU', () => {
      let action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({type: types.LOAD_DEFAULT_VIEWER_MENU});
    });
  });
  describe('openReferencePanel()', () => {
    it('should return a OPEN_REFERENCE_PANEL', () => {
      let action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({type: types.LOAD_DEFAULT_VIEWER_MENU});
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      mockID();
      backend.restore();
      backend
      .mock(APIURL + 'documents/search?searchTerm=term', 'GET', {body: JSON.stringify('documents')})
      .mock(APIURL + 'documents?_id=targetId', 'GET', {body: JSON.stringify({rows: [{target: 'document'}]})})
      .mock(APIURL + 'documents/html?_id=targetId', 'GET', {body: JSON.stringify('html')});
    });

    describe('loadTargetDocument', () => {
      it('should loadTargetDocument with id passed', (done) => {
        let targetId = 'targetId';

        const expectedActions = [
          {type: types.SET_TARGET_DOCUMENT, document: {target: 'document'}, html: 'html'}
        ];
        const store = mockStore({});

        store.dispatch(actions.loadTargetDocument(targetId))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('viewerSearchDocuments', () => {
      it('should searchDocuments with passed searchTerm', (done) => {
        let searchTerm = 'term';

        const expectedActions = [
          {type: types.VIEWER_SEARCHING},
          {type: 'viewer/documentResults/SET', value: 'documents'}
        ];
        const store = mockStore({});

        store.dispatch(actions.viewerSearchDocuments(searchTerm))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', (done) => {
        spyOn(documents.api, 'save').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: types.VIEWER_UPDATE_DOCUMENT, doc}
        ];
        const store = mockStore({});

        store.dispatch(actions.saveDocument(doc))
        .then(() => {
          expect(documents.api.save).toHaveBeenCalledWith(doc);
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
