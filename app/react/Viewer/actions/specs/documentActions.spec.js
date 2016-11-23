import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import Immutable from 'immutable';
import api from 'app/utils/api';

import {PDFUtils} from '../../../PDF/';
import {mockID} from 'shared/uniqueID.js';
import documents from 'app/Documents';
import {APIURL} from 'app/config.js';
import referencesUtils from '../../utils/referencesUtils';
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

  describe('addToToc', () => {
    it('should populate doc form, and add the selected text to its correct place', () => {
      let reference = {sourceDocument: '123', sourceRange: {start: 12, end: 23, text: 'Chapter 1'}};
      let chapter1 = {range: {start: 12, end: 23}, label: 'Chapter 1', indentation: 0};
      let chapter2 = {range: {start: 22, end: 43}, label: 'Chapter 2', indentation: 0};

      const expectedActions = [
        {type: 'documentViewer/tocBeingEdited/SET', value: true},
        {type: 'rrf/change', model: 'documentViewer.tocForm', value: [chapter1, chapter2], silent: true, multi: false},
        {type: types.OPEN_PANEL, panel: 'viewMetadataPanel'},
        {type: types.SHOW_TAB, tab: 'toc'}
      ];

      const store = mockStore({
        documentViewer: {
          tocForm: [],
          doc: Immutable.fromJS({
            toc: [chapter2]
          })
        }
      });

      store.dispatch(actions.addToToc(reference));
      expect(store.getActions()).toEqual(expectedActions);
    });

    describe('if document is already loaded', () => {
      it('should not reload the form', () => {
        let reference = {sourceDocument: '123', sourceRange: {start: 12, end: 23, text: 'Chapter 1'}};
        let chapter1 = {range: {start: 12, end: 23}, label: 'Chapter 1', indentation: 0};
        let chapter2 = {range: {start: 22, end: 43}, label: 'Chapter 2', indentation: 0};
        const expectedActions = [
          {type: 'documentViewer/tocBeingEdited/SET', value: true},
          {type: 'rrf/change', model: 'documentViewer.tocForm', value: [chapter1, chapter2], silent: true, multi: false},
          {type: types.OPEN_PANEL, panel: 'viewMetadataPanel'},
          {type: types.SHOW_TAB, tab: 'toc'}
        ];
        const store = mockStore({
          documentViewer: {
            tocForm: [chapter2],
            doc: Immutable.fromJS({})
          }
        });

        store.dispatch(actions.addToToc(reference));
        expect(store.getActions()).toEqual(expectedActions);
      });
    });
  });

  describe('removeFromToc', () => {
    it('should remove the toc entry from the form', () => {
      let chapter1 = {range: {start: 12, end: 23}, label: 'Chapter 1', indentation: 0, _id: 1};
      let chapter2 = {range: {start: 22, end: 43}, label: 'Chapter 2', indentation: 0, _id: 2};

      const expectedActions = [
        {type: 'rrf/change', model: 'documentViewer.tocForm', value: [chapter1], silent: true, multi: false}
      ];

      const store = mockStore({
        documentViewer: {
          tocForm: [chapter1, chapter2],
          doc: Immutable.fromJS({
            toc: []
          })
        }
      });

      store.dispatch(actions.removeFromToc(chapter2));
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('indentTocElement', () => {
    it('should change the toc entry indentation', () => {
      let chapter1 = {range: {start: 12, end: 23}, label: 'Chapter 1', indentation: 0, _id: 1};
      let chapter2 = {range: {start: 22, end: 43}, label: 'Chapter 2', indentation: 0, _id: 2};

      const expectedActions = [
        {type: 'rrf/change', model: 'documentViewer.tocForm', value: [chapter1, chapter2], silent: true, multi: false}
      ];

      let formState = [chapter1, chapter2];
      const store = mockStore({
        documentViewer: {
          tocForm: formState,
          doc: Immutable.fromJS({
            toc: []
          })
        }
      });

      store.dispatch(actions.indentTocElement(chapter2, 1));
      expect(store.getActions()).toEqual(expectedActions);
      expect(store.getActions()[0].value).not.toBe(formState);
      expect(chapter2.indentation).toBe(1);
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      mockID();
      backend.restore();
      backend
      .mock(APIURL + 'documents/search?searchTerm=term&fields=%5B%22field%22%5D', 'GET', {body: JSON.stringify('documents')})
      .mock(APIURL + 'documents?_id=targetId', 'GET', {body: JSON.stringify({rows: [{target: 'document', pdfInfo: 'test'}]})})
      .mock(APIURL + 'documents?_id=docWithPDFRdy', 'GET', {body: JSON.stringify({rows: [{pdfInfo: 'processed pdf', _id: 'pdfReady'}]})})
      .mock(APIURL + 'documents?_id=docWithPDFNotRdy', 'GET', {body: JSON.stringify({rows: [{_id: 'pdfNotReady'}]})})
      .mock(APIURL + 'documents/html?_id=targetId', 'GET', {body: JSON.stringify('html')})
      .mock(APIURL + 'references/by_document/targetId', 'GET', {body: JSON.stringify([{connectedDocument: '1'}])});
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', (done) => {
        spyOn(documents.api, 'save').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: types.VIEWER_UPDATE_DOCUMENT, doc},
          {type: 'rrf/reset', model: 'documentViewer.docForm'},
          {type: 'viewer/doc/SET', value: 'response'}
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

    describe('getDocument', () => {
      it('should return the document requested', (done) => {
        actions.getDocument('docWithPDFRdy')
        .then((doc) => {
          expect(doc.pdfInfo).toBe('processed pdf');
          done();
        });
      });

      describe('when the doc does not have the pdf processed', () => {
        it('should process it and save it before it gets returned', (done) => {
          spyOn(PDFUtils, 'extractPDFInfo').and.returnValue(Promise.resolve('test'));
          const expected = {_id: 'pdfNotReady', pdfInfo: 'test'};
          spyOn(api, 'post').and.returnValue(Promise.resolve({json: expected}));
          actions.getDocument('docWithPDFNotRdy')
          .then((doc) => {
            expect(PDFUtils.extractPDFInfo).toHaveBeenCalledWith(`${APIURL}documents/download?_id=${expected._id}`);
            expect(api.post).toHaveBeenCalledWith('documents/pdfInfo', expected);
            expect(expected).toBe(doc);
            done();
          });
        });
      });
    });

    describe('saveToc', () => {
      it('should save the document with the new toc and dispatch a notification on success', (done) => {
        spyOn(documents.api, 'save').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};
        let toc = [
          {range: {start: 12, end: 23}, label: 'Chapter 1', indentation: 0},
          {range: {start: 22, end: 44}, label: 'Chapter 1.1', indentation: 1}
        ];

        const expectedActions = [
          {type: 'rrf/reset', model: 'documentViewer.tocForm'},
          {type: 'documentViewer/tocBeingEdited/SET', value: false},
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: types.VIEWER_UPDATE_DOCUMENT, doc: {name: 'doc', toc}},
          {type: 'rrf/reset', model: 'documentViewer.docForm'},
          {type: 'viewer/doc/SET', value: 'response'}
        ];
        const store = mockStore({
          documentViewer: {
            doc: Immutable.fromJS(doc)
          }
        });

        store.dispatch(actions.saveToc(toc))
        .then(() => {
          expect(documents.api.save).toHaveBeenCalledWith({name: 'doc', toc});
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', (done) => {
        spyOn(documents.api, 'delete').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document deleted', type: 'success', id: 'unique_id'}},
          {type: types.RESET_DOCUMENT_VIEWER},
          {type: 'REMOVE_DOCUMENT', doc: {name: 'doc'}},
          {type: 'VIEWER/UNSELECT_DOCUMENT'}
        ];
        const store = mockStore({});

        store.dispatch(actions.deleteDocument(doc))
        .then(() => {
          expect(documents.api.delete).toHaveBeenCalledWith(doc);
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('loadTargetDocument', () => {
      beforeEach(() => {
        spyOn(referencesUtils, 'filterRelevant').and.returnValue(['filteredReferences']);
      });

      it('should loadTargetDocument with id passed', (done) => {
        let targetId = 'targetId';

        const expectedActions = [
          {type: 'viewer/targetDoc/SET', value: {target: 'document', pdfInfo: 'test'}},
          {type: 'viewer/targetDocReferences/SET', value: ['filteredReferences']}
        ];
        const store = mockStore({locale: 'es'});

        store.dispatch(actions.loadTargetDocument(targetId))
        .then(() => {
          expect(referencesUtils.filterRelevant).toHaveBeenCalledWith([{connectedDocument: '1'}], 'es');
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('cancelTargetDocument', () => {
      it('should reset ranged connection defaults', () => {
        const expectedActions = [
          {type: 'CANCEL_RANGED_CONNECTION'},
          {type: 'viewer/targetDoc/UNSET'},
          {type: 'viewer/targetDocReferences/UNSET'},
          {type: 'UNSET_TARGET_SELECTION'},
          {type: 'OPEN_PANEL', panel: 'viewMetadataPanel'}
        ];
        const store = mockStore({});

        store.dispatch(actions.cancelTargetDocument());
        expect(store.getActions()).toEqual(expectedActions);
      });
    });
  });
});
