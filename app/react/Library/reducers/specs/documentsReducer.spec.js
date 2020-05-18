import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import documentsReducer from 'app/Library/reducers/documentsReducer';
import * as actions from 'app/Library/actions/libraryActions';
import 'jasmine-immutablejs-matchers';

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

      expect(newState).toEqualImmutable(Immutable.fromJS(documents));
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
        documents: { rows: [documentTwo], totalRows: 10 },
      });

      expect(newState.toJS()).toEqual({ rows: [documentOne, documentTwo], totalRows: 10 });
    });
  });

  describe('UNSET_DOCUMENTS', () => {
    it('should set the initial state', () => {
      const newState = documentsReducer(Immutable.fromJS({ rows: [{}] }), actions.unsetDocuments());
      expect(newState).toEqual(initialState);
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
});
