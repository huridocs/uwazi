/* eslint-disable max-lines */
import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import { documentsReducer } from 'app/Library/reducers/documentsReducer';
import * as actions from 'app/Library/actions/libraryActions';
import * as uploadTypes from 'app/Uploads/actions/actionTypes';
import * as attachmentTypes from 'app/Attachments/actions/actionTypes';

describe('documentsReducer', () => {
  const initialState = Immutable.fromJS({ rows: [], totalRows: 0 });

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = documentsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_DOCUMENTS', () => {
    it('should set the documents in the state', () => {
      const documents = [
        { title: 'Song of Ice and Fire: The Winds of Winter' },
        { title: 'Song of Ice and Fire: A Dream of Spring' },
      ];
      const newState = documentsReducer(initialState, { type: types.SET_DOCUMENTS, documents });

      expect(newState.toJS()).toEqual(documents);
    });
  });

  describe('UNSET_DOCUMENTS', () => {
    it('should set the initial state', () => {
      const newState = documentsReducer(Immutable.fromJS({ rows: [{}] }), actions.unsetDocuments());
      expect(newState).toEqual(initialState);
    });
  });

  describe('ADD_DOCUMENTS', () => {
    it('should add the documents in the state', () => {
      const documentOne = { title: 'Song of Ice and Fire: The Winds of Winter' };
      const documentTwo = { title: 'Song of Ice and Fire: A Dream of Spring' };
      let newState = documentsReducer(initialState, {
        type: types.SET_DOCUMENTS,
        documents: { rows: [documentOne], totalRows: 10 },
      });

      newState = documentsReducer(newState, {
        type: types.ADD_DOCUMENTS,
        documents: { rows: [documentTwo], totalRows: 7 },
      });

      expect(newState.toJS()).toEqual({ rows: [documentOne, documentTwo], totalRows: 7 });
    });
  });

  describe('LIBRARY/UPDATE_DOCUMENT', () => {
    it('should set the documents in the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1 },
          { title: '2', _id: 2 },
        ],
      });
      const newState = documentsReducer(currentState, {
        type: types.UPDATE_DOCUMENT,
        doc: { _id: 2, title: 'new title' },
      });

      expect(newState.toJS()).toEqual({
        rows: [
          { title: '1', _id: 1 },
          { title: 'new title', _id: 2 },
        ],
      });
    });
  });

  describe('LIBRARY/UPDATE_DOCUMENTS', () => {
    it('should set the documents in the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1 },
          { title: '2', _id: 2 },
        ],
      });
      const newState = documentsReducer(currentState, {
        type: types.UPDATE_DOCUMENTS,
        docs: [
          {
            title: '1!',
            _id: 1,
          },
          {
            _id: 2,
            title: 'new title',
          },
        ],
      });

      expect(newState.toJS()).toEqual({
        rows: [
          { title: '1!', _id: 1 },
          { title: 'new title', _id: 2 },
        ],
      });
    });
  });

  describe('UPDATE_DOCUMENTS_PUBLISHED', () => {
    it('update the entities with the provided publishing status', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1, sharedId: 'shared1', published: false },
          { title: '2', _id: 2, sharedId: 'shared2', published: false },
          { title: '3', _id: 3, sharedId: 'shared3', published: false },
        ],
        totalRows: 3,
      });
      const newState = documentsReducer(currentState, {
        type: types.UPDATE_DOCUMENTS_PUBLISHED,
        sharedIds: ['shared2', 'shared3'],
        published: true,
      });

      expect(newState.toJS()).toEqual({
        rows: [
          { title: '1', _id: 1, sharedId: 'shared1', published: false },
          { title: '2', _id: 2, sharedId: 'shared2', published: true },
          { title: '3', _id: 3, sharedId: 'shared3', published: true },
        ],
        totalRows: 3,
      });
    });
  });

  describe('ELEMENT_CREATED', () => {
    it('should add the new document to the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1, sharedId: 'shared1' },
          { title: '2', _id: 2, sharedId: 'shared2' },
        ],
      });
      const newState = documentsReducer(currentState, {
        type: types.ELEMENT_CREATED,
        doc: { title: '3', _id: 3, sharedId: 'shared3' },
      });

      expect(newState.toJS()).toEqual({
        rows: [
          { title: '3', _id: 3, sharedId: 'shared3' },
          { title: '1', _id: 1, sharedId: 'shared1' },
          { title: '2', _id: 2, sharedId: 'shared2' },
        ],
      });
    });
  });

  describe('REMOVE_DOCUMENT', () => {
    it('should remove the document from the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1 },
          { title: '2', _id: 2 },
        ],
      });
      const newState = documentsReducer(currentState, {
        type: types.REMOVE_DOCUMENT,
        doc: { title: '1', _id: 1 },
      });

      expect(newState.toJS()).toEqual({ rows: [{ title: '2', _id: 2 }] });
    });

    describe('when the document is not in the list', () => {
      it('should do nothing', () => {
        const currentState = Immutable.fromJS({
          rows: [
            { title: '1', _id: 1 },
            { title: '2', _id: 2 },
          ],
        });
        const newState = documentsReducer(currentState, {
          type: types.REMOVE_DOCUMENT,
          doc: { title: '3', _id: 3 },
        });

        expect(newState.toJS()).toEqual({
          rows: [
            { title: '1', _id: 1 },
            { title: '2', _id: 2 },
          ],
        });
      });
    });
  });

  describe('REMOVE_DOCUMENTS', () => {
    it('should remove the documents from the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1 },
          { title: '2', _id: 2 },
          { title: '3', _id: 3 },
        ],
      });
      const newState = documentsReducer(currentState, {
        type: types.REMOVE_DOCUMENTS,
        docs: [
          { title: '2', _id: 2 },
          { title: '3', _id: 3 },
        ],
      });

      expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }] });
    });

    describe('when the document is not in the list', () => {
      it('should do nothing', () => {
        const currentState = Immutable.fromJS({
          rows: [
            { title: '1', _id: 1 },
            { title: '2', _id: 2 },
          ],
        });
        const newState = documentsReducer(currentState, {
          type: types.REMOVE_DOCUMENTS,
          docs: [
            { title: '2', _id: 2 },
            { title: '3', _id: 3 },
          ],
        });

        expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }] });
      });
    });
  });

  describe('REMOVE_DOCUMENTS_SHAREDIDS', () => {
    it('should remove the documents with the matching sharedIds from the state', () => {
      const currentState = Immutable.fromJS({
        rows: [
          { title: '1', _id: 1, sharedId: 'shared1' },
          { title: '2', _id: 2, sharedId: 'shared2' },
          { title: '3', _id: 3, sharedId: 'shared3' },
        ],
        totalRows: 3,
      });
      const newState = documentsReducer(currentState, {
        type: types.REMOVE_DOCUMENTS_SHAREDIDS,
        sharedIds: ['shared2', 'shared3'],
      });

      expect(newState.toJS()).toEqual({
        rows: [{ title: '1', _id: 1, sharedId: 'shared1' }],
        totalRows: 1,
      });
    });

    describe('when the document is not in the list', () => {
      it('should do nothing', () => {
        const currentState = Immutable.fromJS({
          rows: [
            { title: '1', _id: 1, sharedId: 'shared1' },
            { title: '2', _id: 2, sharedId: 'shared2' },
          ],
          totalRows: 2,
        });
        const newState = documentsReducer(currentState, {
          type: types.REMOVE_DOCUMENTS_SHAREDIDS,
          sharedIds: ['shared2', 'shared3'],
        });

        expect(newState.toJS()).toEqual({
          rows: [{ title: '1', _id: 1, sharedId: 'shared1' }],
          totalRows: 1,
        });
      });
    });
  });

  describe('UPLOAD_COMPLETE', () => {
    it('should update the state with the uploaded document', () => {
      const currentState = Immutable.fromJS({
        rows: [
          {
            title: '1',
            _id: 1,
            sharedId: 'shared1',
            documents: [],
          },
        ],
      });

      const newState = documentsReducer(currentState, {
        type: uploadTypes.UPLOAD_COMPLETE,
        doc: 'shared1',
        file: { filename: 'My PDF.pdf', entity: 'shared1' },
      });

      expect(newState.toJS()).toEqual({
        rows: [
          {
            title: '1',
            _id: 1,
            sharedId: 'shared1',
            documents: [{ filename: 'My PDF.pdf', entity: 'shared1' }],
          },
        ],
      });
    });
  });

  describe('UPLOADS_COMPLETE', () => {
    it('should update the state with the uploaded documents', () => {
      const currentState = Immutable.fromJS({
        rows: [
          {
            title: '1',
            _id: 1,
            sharedId: 'shared1',
            documents: [{ filename: 'My PDF.pdf', entity: 'shared1', status: 'processing' }],
          },
        ],
      });

      const newState = documentsReducer(currentState, {
        type: uploadTypes.UPLOADS_COMPLETE,
        doc: 'shared1',
        files: [
          { filename: 'My new PDF.pdf', entity: 'shared1', status: 'failed' },
          { filename: 'My PDF.pdf', entity: 'shared1', status: 'ready' },
        ],
      });

      expect(newState.toJS()).toEqual({
        rows: [
          {
            title: '1',
            _id: 1,
            sharedId: 'shared1',
            documents: [
              { filename: 'My new PDF.pdf', entity: 'shared1', status: 'failed' },
              { filename: 'My PDF.pdf', entity: 'shared1', status: 'ready' },
            ],
          },
        ],
      });
    });
  });

  describe('Attachments', () => {
    const initialDocumentsState = {
      rows: [
        {
          title: '1',
          _id: 1,
          sharedId: 'shared1',
          attachments: [{ _id: 'fileId1', originalname: 'file1' }],
        },
        {
          title: '2',
          _id: 2,
          sharedId: 'shared2',
          published: false,
          attachments: [{ _id: 'fileId2', originalname: 'file2' }],
        },
        {
          title: '3',
          _id: 3,
          sharedId: 'shared3',
          published: false,
          attachments: [
            { _id: 'fileId3', originalname: 'file3' },
            { _id: 'fileId3a', originalname: 'file3a' },
          ],
        },
      ],
      totalRows: 3,
    };

    const assertAttachmentReducer = (action, expectedIndex, expectedAttachments) => {
      const newState = documentsReducer(Immutable.fromJS(initialDocumentsState), action);

      const expectedState = {
        ...initialDocumentsState,
      };
      expectedState.rows[expectedIndex].attachments = expectedAttachments;
      expect(newState.toJS()).toEqual(expectedState);
    };

    describe('ATTACHMENT_COMPLETE', () => {
      it('should push the newly uploaded file to the entity attachments', () => {
        assertAttachmentReducer(
          {
            type: attachmentTypes.ATTACHMENT_COMPLETE,
            entity: 'shared2',
            file: { _id: 'fileId2a', originalname: 'file2a' },
          },
          1,
          [
            { _id: 'fileId2', originalname: 'file2' },
            { _id: 'fileId2a', originalname: 'file2a' },
          ]
        );
      });
    });

    describe('ATTACHMENT_DELETED', () => {
      it('should remove the deleted file from the entity attachments', () => {
        assertAttachmentReducer(
          {
            type: attachmentTypes.ATTACHMENT_DELETED,
            entity: 'shared3',
            file: { _id: 'fileId3a', originalname: 'file3a' },
          },
          2,
          [{ _id: 'fileId3', originalname: 'file3' }]
        );
      });
    });

    describe('ATTACHMENT_RENAMED', () => {
      it('should rename the changed file in the entity attachments', () => {
        assertAttachmentReducer(
          {
            type: attachmentTypes.ATTACHMENT_RENAMED,
            entity: 'shared1',
            file: { _id: 'fileId1', originalname: 'fileRenamed' },
          },
          0,
          [{ _id: 'fileId1', originalname: 'fileRenamed' }]
        );
      });
    });
  });
});
