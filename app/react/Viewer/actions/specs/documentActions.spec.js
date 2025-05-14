/**
 * @jest-environment jsdom
 */
/* eslint-disable max-nested-callbacks */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import Immutable from 'immutable';
import api from 'app/utils/api';

import { mockID } from 'shared/uniqueID.js';
import { documentsApi } from 'app/Documents';
import { APIURL } from 'app/config.js';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import { actions as formActions } from 'react-redux-form';
import { actions as relationshipActions } from 'app/Relationships';
import { RequestParams } from 'app/utils/RequestParams';
import * as libraryActions from '../../../Library/actions/saveEntityWithFiles';
import * as actions from '../documentActions';
import * as types from '../actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('documentActions', () => {
  describe('setDocument()', () => {
    it('should return a SET_REFERENCES type action with the document', () => {
      const action = actions.setDocument('document', 'html');
      expect(action).toEqual({ type: types.SET_DOCUMENT, document: 'document', html: 'html' });
    });
  });
  describe('resetDocumentViewer()', () => {
    it('should return a RESET_DOCUMENT_VIEWER', () => {
      const action = actions.resetDocumentViewer();
      expect(action).toEqual({ type: types.RESET_DOCUMENT_VIEWER });
    });
  });
  describe('loadDefaultViewerMenu()', () => {
    it('should return a LOAD_DEFAULT_VIEWER_MENU', () => {
      const action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({ type: types.LOAD_DEFAULT_VIEWER_MENU });
    });
  });
  describe('openReferencePanel()', () => {
    it('should return a OPEN_REFERENCE_PANEL', () => {
      const action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({ type: types.LOAD_DEFAULT_VIEWER_MENU });
    });
  });

  describe('addToToc', () => {
    it('should populate doc form, and add the selected text to its correct place', () => {
      spyOn(formActions, 'load').and.returnValue({ type: 'loadAction' });
      const reference = {
        sourceDocument: '123',
        sourceRange: {
          selectionRectangles: [{ top: 12, left: 23, hight: 42, width: 21, page: '1' }],
          text: 'Chapter 1',
        },
      };
      const chapter1 = {
        selectionRectangles: [{ top: 12, left: 23, hight: 42, width: 21, page: '1' }],
        label: 'Chapter 1',
        indentation: 0,
      };
      const chapter2 = {
        selectionRectangles: [{ top: 22, left: 23, hight: 42, width: 21, page: '1' }],
        label: 'Chapter 2',
        indentation: 0,
      };

      const expectedActions = [
        { type: 'CLOSE_CONNECTION_PANEL' },
        { type: 'documentViewer/tocBeingEdited/SET', value: true },
        { type: 'loadAction' },
        { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
        { type: 'viewer.sidepanel.tab/SET', value: 'toc' },
      ];

      const store = mockStore({
        documentViewer: {
          tocForm: [],
        },
      });

      const currentToc = [chapter2];
      store.dispatch(actions.addToToc(reference, currentToc));

      expect(store.getActions()).toEqual(expectedActions);
      expect(formActions.load).toHaveBeenCalledWith('documentViewer.tocForm', [chapter1, chapter2]);
    });

    describe('if document is already loaded', () => {
      it('should not reload the form', () => {
        spyOn(formActions, 'load').and.returnValue({ type: 'loadAction' });
        const reference = {
          sourceDocument: '123',
          sourceRange: {
            selectionRectangles: [{ top: 12, left: 23, hight: 42, width: 21, page: '1' }],
            text: 'Chapter 1',
          },
        };
        const chapter1 = {
          selectionRectangles: [{ top: 12, left: 23, hight: 42, width: 21, page: '1' }],
          label: 'Chapter 1',
          indentation: 0,
        };
        const chapter2 = {
          selectionRectangles: [{ top: 22, left: 23, hight: 42, width: 21, page: '1' }],
          label: 'Chapter 2',
          indentation: 0,
        };

        const expectedActions = [
          { type: 'CLOSE_CONNECTION_PANEL' },
          { type: 'documentViewer/tocBeingEdited/SET', value: true },
          { type: 'loadAction' },
          { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
          { type: 'viewer.sidepanel.tab/SET', value: 'toc' },
        ];
        const store = mockStore({
          documentViewer: {
            tocForm: [chapter2],
            doc: Immutable.fromJS({}),
          },
        });

        store.dispatch(actions.addToToc(reference));
        expect(store.getActions()).toEqual(expectedActions);
        expect(formActions.load).toHaveBeenCalledWith('documentViewer.tocForm', [
          chapter1,
          chapter2,
        ]);
      });
    });
  });

  describe('removeFromToc', () => {
    it('should remove the toc entry from the form', () => {
      spyOn(formActions, 'load').and.returnValue({ type: 'loadAction' });
      const chapter1 = {
        range: { start: 12, end: 23 },
        label: 'Chapter 1',
        indentation: 0,
        _id: 1,
      };
      const chapter2 = {
        range: { start: 22, end: 43 },
        label: 'Chapter 2',
        indentation: 0,
        _id: 2,
      };

      const expectedActions = [{ type: 'loadAction' }];

      const store = mockStore({
        documentViewer: {
          tocForm: [chapter1, chapter2],
          doc: Immutable.fromJS({
            toc: [],
          }),
        },
      });

      store.dispatch(actions.removeFromToc(chapter2));

      expect(formActions.load).toHaveBeenCalledWith('documentViewer.tocForm', [chapter1]);
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('indentTocElement', () => {
    it('should change the toc entry indentation', () => {
      const chapter1 = {
        range: { start: 12, end: 23 },
        label: 'Chapter 1',
        indentation: 0,
        _id: 1,
      };
      const chapter2 = {
        range: { start: 22, end: 43 },
        label: 'Chapter 2',
        indentation: 0,
        _id: 2,
      };

      const formState = [chapter1, chapter2];
      const store = mockStore({
        documentViewer: {
          tocForm: formState,
          doc: Immutable.fromJS({
            toc: [],
          }),
        },
      });

      store.dispatch(actions.indentTocElement(chapter2, 1));
      expect(store.getActions()[0].type).toBe('rrf/change');
      expect(store.getActions()[0].model).toBe('documentViewer.tocForm');
      expect(store.getActions()[0].value[1].indentation).toBe(1);
    });
  });

  describe('leaveEditMode', () => {
    it('should turn off edition flags', () => {
      const store = mockStore({
        documentViewer: {
          documentViewer: { tocBeingEdited: true },
        },
      });
      store.dispatch(actions.leaveEditMode());
      expect(store.getActions()[0].type).toBe('documentViewer/tocBeingEdited/SET');
      expect(store.getActions()[0].value).toBe(false);
      expect(store.getActions()[1].type).toBe('rrf/reset');
      expect(store.getActions()[1].model).toBe('documentViewer.sidepanel.metadata');
    });
  });
  describe('async actions', () => {
    beforeEach(() => {
      mockID();
      backend.restore();
      backend
        .get(`${APIURL}documents/search?searchTerm=term&fields=%5B%22field%22%5D`, {
          body: JSON.stringify('documents'),
        })
        .get(
          `${APIURL}entities?sharedId=targetId&omitRelationships=true&include=%5B%22permissions%22%5D`,
          {
            body: JSON.stringify({
              rows: [{ documents: [{ _id: 'fileId' }] }],
            }),
          }
        )
        .get(
          `${APIURL}entities?sharedId=docCalledWithWrongPDFFilename&omitRelationships=true&include=%5B%22permissions%22%5D`,
          {
            body: JSON.stringify({
              rows: [
                {
                  _id: 'pdfCalledWithWrongFilename',
                  sharedId: 'shared',
                  documents: [
                    {
                      _id: 'pdfCalledWithWrongFilename',
                      filename: 'filename',
                    },
                  ],
                },
              ],
            }),
          }
        )
        .get(
          `${APIURL}entities?sharedId=docWithPDFRdy&omitRelationships=true&include=%5B%22permissions%22%5D`,
          {
            body: JSON.stringify({
              rows: [{ documents: [{ _id: 'pdfReady' }] }],
            }),
          }
        )
        .get(`${APIURL}entities?sharedId=docWithPDFNotRdy`, {
          body: JSON.stringify({
            rows: [
              {
                _id: 'pdfNotReady',
                sharedId: 'shared',
                documents: [{ _id: 'pdfNotReady', filename: 'filename' }],
              },
            ],
          }),
        })
        .get(
          `${APIURL}references/by_document?sharedId=targetId&file=fileId&onlyTextReferences=true`,
          {
            body: JSON.stringify([{ connectedDocument: '1' }]),
          }
        );
    });

    afterEach(() => backend.restore());

    describe('saveDocument', () => {
      it('should save the document (omitting fullText) and dispatch a notification on success', done => {
        const defaultDocument = { _id: 'file1', originalName: 'File 1' };
        const docWithExtractedMetadata = {
          ...defaultDocument,
          extractedMetadata: { title: 'Title' },
        };
        spyOn(libraryActions, 'saveEntityWithFiles').and.returnValue(
          Promise.resolve({
            entity: { sharedId: 'responseId', documents: [docWithExtractedMetadata] },
          })
        );
        spyOn(relationshipActions, 'reloadRelationships').and.returnValue({
          type: 'reloadRelationships',
        });
        const doc = {
          name: 'doc',
          fullText: 'fullText',
          attachments: [{ _id: '1', originalname: 'supportingFile' }],
          defaultDoc: defaultDocument,
        };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Document updated', type: 'success', id: 'unique_id' },
          },
          {
            type: types.VIEWER_UPDATE_DOCUMENT,
            doc: {
              name: 'doc',
              fullText: 'fullText',
              attachments: [{ _id: '1', originalname: 'supportingFile' }],
              defaultDoc: defaultDocument,
            },
          },
          { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
          {
            type: 'viewer/doc/UPDATE',
            value: {
              sharedId: 'responseId',
              defaultDoc: docWithExtractedMetadata,
              documents: [docWithExtractedMetadata],
            },
          },
          { type: 'reloadRelationships' },
        ];
        const store = mockStore({
          documentViewer: {
            metadataExtraction: Immutable.fromJS([]),
            doc: Immutable.fromJS({ defaultDoc: defaultDocument }),
          },
        });

        store
          .dispatch(actions.saveDocument(doc))
          .then(() => {
            expect(libraryActions.saveEntityWithFiles).toHaveBeenCalledWith(
              {
                __extractedMetadata: { fileID: 'file1' },
                attachments: [{ _id: '1', originalname: 'supportingFile' }],
                name: 'doc',
              },
              expect.any(Function)
            );
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('getDocument', () => {
      it('should return the document requested', async () => {
        const requestParams = new RequestParams({ sharedId: 'docWithPDFRdy' });
        const doc = await actions.getDocument(requestParams);
        expect(doc.documents[0]).toEqual({ _id: 'pdfReady' });
      });
      it('should return empty object if the document is requested with wrong file name', async () => {
        const requestParams = new RequestParams({ sharedId: 'docCalledWithWrongPDFFilename' });
        const doc = await actions.getDocument(requestParams, 'en', 'filenam');
        expect(doc.documents[0].filename).not.toBe('filenam');
        expect(doc.defaultDoc).toEqual({});
      });
    });

    describe('saveToc', () => {
      it('should save the document with the new toc and dispatch a notification on success', done => {
        const toc = [
          { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0 },
          { range: { start: 22, end: 44 }, label: 'Chapter 1.1', indentation: 1 },
        ];

        const fileId = 'fileId';

        backend.post(`${APIURL}files`, {
          body: JSON.stringify({ _id: fileId, toc }),
        });

        spyOn(relationshipActions, 'reloadRelationships').and.returnValue({
          type: 'reloadRelationships',
        });

        const doc = {
          name: 'doc',
          _id: 'id',
          sharedId: 'sharedId',
          defaultDoc: {
            _id: fileId,
            toc: [{ _id: fileId }],
          },
          documents: [
            {
              _id: fileId,
              toc: [{ _id: fileId }],
            },
          ],
        };

        const updatedEntity = {
          name: 'doc',
          _id: 'id',
          sharedId: 'sharedId',
          defaultDoc: {
            _id: fileId,
            toc,
          },
          documents: [
            {
              _id: fileId,
              toc,
            },
          ],
        };

        const expectedActions = [
          { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
          { type: 'documentViewer/tocBeingEdited/SET', value: false },
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Document updated', type: 'success', id: 'unique_id' },
          },
          {
            type: types.VIEWER_UPDATE_DOCUMENT,
            doc: updatedEntity,
          },
          { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
          { type: 'viewer/doc/SET', value: updatedEntity },
        ];
        const store = mockStore({
          documentViewer: {
            doc: Immutable.fromJS(doc),
          },
        });

        spyOn(api, 'post').and.callThrough();
        store
          .dispatch(actions.saveToc(toc, fileId))
          .then(() => {
            expect(api.post).toHaveBeenCalledWith('files', {
              data: {
                _id: 'fileId',
                toc,
              },
              headers: {},
            });
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', done => {
        spyOn(documentsApi, 'delete').and.callFake(async () => Promise.resolve('response'));
        const doc = { sharedId: 'sharedId', name: 'doc' };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Document deleted', type: 'success', id: 'unique_id' },
          },
          { type: types.RESET_DOCUMENT_VIEWER },
          { type: 'REMOVE_DOCUMENT', doc: { sharedId: 'sharedId', name: 'doc' } },
          { type: 'UNSELECT_ALL_DOCUMENTS' },
        ];
        const store = mockStore({});

        store
          .dispatch(actions.deleteDocument(doc))
          .then(() => {
            expect(documentsApi.delete).toHaveBeenCalledWith(
              new RequestParams({ sharedId: 'sharedId' })
            );
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('loadTargetDocument', () => {
      it('should loadTargetDocument with id passed', async () => {
        const targetId = 'targetId';

        const expectedActions = [
          {
            type: 'viewer/targetDoc/SET',
            value: { defaultDoc: { _id: 'fileId' }, documents: [{ _id: 'fileId' }] },
          },
          { type: 'viewer/targetDocReferences/SET', value: [{ connectedDocument: '1' }] },
        ];
        const store = mockStore({ locale: 'es' });

        await store.dispatch(actions.loadTargetDocument(targetId));
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('cancelTargetDocument', () => {
      it('should reset ranged connection defaults', () => {
        const expectedActions = [
          { type: 'CANCEL_RANGED_CONNECTION' },
          { type: 'viewer/targetDoc/UNSET' },
          { type: 'viewer/targetDocReferences/UNSET' },
          { type: 'UNSET_TARGET_SELECTION' },
          { type: 'OPEN_PANEL', panel: 'viewMetadataPanel' },
        ];
        const store = mockStore({});

        store.dispatch(actions.cancelTargetDocument());
        expect(store.getActions()).toEqual(expectedActions);
      });
    });
  });
});
