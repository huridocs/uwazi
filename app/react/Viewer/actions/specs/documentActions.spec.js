import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {APIURL} from 'app/config.js';
import * as actions from 'app/Viewer/actions/documentActions';
import * as types from 'app/Viewer/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('documentActions', () => {
  describe('setDocument()', () => {
    it('should return a SET_REFERENCES type action with the document', () => {
      let action = actions.setDocument('document');
      expect(action).toEqual({type: types.SET_DOCUMENT, document: 'document'});
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
      backend.restore();
      backend
      .mock(APIURL + 'documents/search?searchTerm=term', 'GET', {body: JSON.stringify('documents')})
      .mock(APIURL + 'documents?_id=targetId', 'GET', {body: JSON.stringify({rows: [{target: 'document'}]})});
    });

    describe('loadTargetDocument', () => {
      it('should loadTargetDocument with id passed', (done) => {
        let targetId = 'targetId';

        const expectedActions = [
          {type: types.SET_TARGET_DOCUMENT, document: {target: 'document'}}
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
          {type: types.SET_VIEWER_RESULTS, results: 'documents'}
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
  });
});
