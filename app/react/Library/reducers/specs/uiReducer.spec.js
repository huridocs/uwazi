import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import uiReducer from 'app/Library/reducers/uiReducer';

describe('uiReducer', () => {
  const initialState = Immutable.fromJS({
    searchTerm: '',
    previewDoc: '',
    suggestions: [],
    selectedDocuments: [],
    filtersPanel: false,
    zoomLevel: 0,
    tableViewColumns: Immutable.fromJS([]),
  });

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('selectDocument', () => {
    it('should set selected document', () => {
      const newState = uiReducer(initialState, {
        type: types.SELECT_DOCUMENT,
        doc: { _id: 'document' },
      });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
    });

    it('should not select an already selected document', () => {
      let newState = uiReducer(initialState, {
        type: types.SELECT_DOCUMENT,
        doc: { _id: 'document' },
      });
      newState = uiReducer(newState, {
        type: types.SELECT_DOCUMENT,
        doc: { _id: 'document', something: 'change' },
      });
      expect(newState.get('selectedDocuments').size).toBe(1);
    });
  });

  describe('selectSingleDocument', () => {
    it('should set document and remove any other', () => {
      let newState = uiReducer(initialState, {
        type: types.SELECT_DOCUMENT,
        doc: { _id: 'document' },
      });
      newState = uiReducer(initialState, {
        type: types.SELECT_SINGLE_DOCUMENT,
        doc: { _id: 'other_document' },
      });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('other_document');
      expect(newState.get('selectedDocuments').size).toBe(1);
    });
  });

  describe('selectDocuments', () => {
    it('should add the documents to the selected document list', () => {
      const newState = uiReducer(initialState, {
        type: types.SELECT_DOCUMENTS,
        docs: [{ _id: 'document' }, { _id: 'document2' }],
      });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
      expect(newState.get('selectedDocuments').size).toBe(2);
      expect(newState.get('selectedDocuments').last().get('_id')).toBe('document2');
    });

    it('should not select an already selected document', () => {
      let newState = uiReducer(initialState, {
        type: types.SELECT_DOCUMENTS,
        docs: [{ _id: 'document' }],
      });
      newState = uiReducer(newState, {
        type: types.SELECT_DOCUMENTS,
        docs: [{ _id: 'document' }, { _id: 'document2' }, { _id: 'document3' }],
      });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
      expect(newState.get('selectedDocuments').size).toBe(3);
      expect(newState.get('selectedDocuments').last().get('_id')).toBe('document3');
    });
  });

  describe('unselectDocument', () => {
    it('should set selected document', () => {
      const newState = uiReducer(Immutable.fromJS({ selectedDocuments: [{ _id: 'document' }] }), {
        type: types.UNSELECT_DOCUMENT,
        docId: 'document',
      });
      expect(newState.toJS().selectedDocuments.length).toBe(0);
    });
  });

  describe('unselectAllDocuments', () => {
    it('should set selected document', () => {
      const newState = uiReducer(Immutable.fromJS({ selectedDocuments: [{ _id: 'document' }] }), {
        type: types.UNSELECT_ALL_DOCUMENTS,
      });
      expect(newState.toJS().selectedDocuments.length).toBe(0);
    });
  });

  describe('SET_SEARCHTERM', () => {
    it('should set the searchTerm in the state', () => {
      const newState = uiReducer(initialState, {
        type: types.SET_SEARCHTERM,
        searchTerm: 'something cool',
      });
      expect(newState.toJS().searchTerm).toBe('something cool');
    });

    describe('when the searchTerm is empty', () => {
      it('should clear the suggestions', () => {
        const state = initialState.set('suggestions', ['some', 'suggestions']);
        const newState = uiReducer(state, { type: types.SET_SEARCHTERM, searchTerm: '' });
        expect(newState.toJS().suggestions).toEqual([]);
      });
    });
  });

  describe('SET_SUGGESTIONS', () => {
    it('should set the suggestions in the state', () => {
      const suggestions = [{ title: 'something' }];
      const newState = uiReducer(initialState, { type: types.SET_SUGGESTIONS, suggestions });
      expect(newState.get('suggestions').toJS()).toEqual(suggestions);
    });
  });

  describe('SHOW_FILTERS', () => {
    it('should set the filtersPanel to true', () => {
      const newState = uiReducer(initialState, { type: types.SHOW_FILTERS });
      expect(newState.toJS().filtersPanel).toBe(true);
    });
  });

  describe('HIDE_FILTERS', () => {
    it('should set the filtersPanel to false', () => {
      const newState = uiReducer(initialState, { type: types.HIDE_FILTERS });
      expect(newState.toJS().filtersPanel).toBe(false);
    });
  });

  describe('SHOW_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      const newState = uiReducer(initialState, { type: types.SHOW_SUGGESTIONS });
      expect(newState.toJS().showSuggestions).toBe(true);
    });
  });

  describe('HIDE_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      const newState = uiReducer(initialState, { type: types.HIDE_SUGGESTIONS });
      expect(newState.toJS().showSuggestions).toBe(false);
    });
  });

  describe('OVER_SUGGESTIONS', () => {
    it('should set the overSuggestions to true', () => {
      let newState = uiReducer(initialState, { type: types.OVER_SUGGESTIONS, hover: false });
      expect(newState.toJS().overSuggestions).toBe(false);

      newState = uiReducer(initialState, { type: types.OVER_SUGGESTIONS, hover: true });
      expect(newState.toJS().overSuggestions).toBe(true);
    });
  });

  describe('SET_PREVIEW_DOC', () => {
    it('should set the searchTerm in the state', () => {
      const newState = uiReducer(initialState, { type: types.SET_PREVIEW_DOC, docId: 'docId' });
      expect(newState.toJS().previewDoc).toBe('docId');
    });
  });

  describe('ZOOM_IN, ZOOM_OUT', () => {
    it('should increase or decrease the zoom level', () => {
      let changedState = uiReducer(initialState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(1);
      changedState = uiReducer(changedState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(2);
      changedState = uiReducer(changedState.set('zoomLevel', 4), { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(3);
      changedState = uiReducer(changedState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(3);
      changedState = uiReducer(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(2);
      changedState = uiReducer(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(1);

      changedState = uiReducer(initialState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-1);
      changedState = uiReducer(changedState.set('zoomLevel', -4), { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-3);
      changedState = uiReducer(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-3);
    });
  });

  describe('SET_TABLE_VIEW_COLUMNS', () => {
    describe('if new columns is an empty array', () => {
      it('should not update state ', () => {
        const previousState = Immutable.fromJS({ tableViewColumns: [{ name: 'column1' }] });
        const newState = uiReducer(previousState, {
          type: types.SET_TABLE_VIEW_COLUMNS,
          columns: [],
        });
        expect(newState).toEqual(previousState);
      });
    });
    describe('when there are no columns in initial state', () => {
      const columns = [
        {
          label: 'Country',
          name: 'country',
          showInCard: true,
        },
        {
          label: 'Birth date',
          name: 'birth date',
        },
      ];
      const selectableColumns = uiReducer(initialState, {
        type: types.SET_TABLE_VIEW_COLUMNS,
        columns,
      }).get('tableViewColumns');
      it('should not set as hidden columns with showInCard true', () => {
        expect(selectableColumns.get(0).get('hidden')).toBe(false);
      });
      it('should set as hidden columns with showInCard false or undefined', () => {
        expect(selectableColumns.get(1).get('hidden')).toBe(true);
      });
    });
    describe('when there are previous columns in initial state', () => {
      const initialColumnsState = Immutable.fromJS({
        tableViewColumns: [
          {
            label: 'Country',
            name: 'country',
            showInCard: true,
            hidden: true,
          },
          {
            label: 'Birth date',
            name: 'birth date',
            hidden: false,
          },
          {
            label: 'Other',
            name: 'other',
          },
        ],
      });
      const columns = [
        {
          label: 'Country',
          name: 'country',
          showInCard: true,
        },
        {
          label: 'Birth date',
          name: 'birth date',
        },
      ];
      const selectableColumns = uiReducer(initialColumnsState, {
        type: types.SET_TABLE_VIEW_COLUMNS,
        columns,
      }).get('tableViewColumns');
      it('should keep previous hidden value from initial state', () => {
        expect(selectableColumns.get(0).get('hidden')).toBe(true);
        expect(selectableColumns.get(1).get('hidden')).toBe(false);
      });
      it('should only keep new action columns', () => {
        expect(selectableColumns.size).toBe(2);
      });
    });
  });

  describe('SET_TABLE_VIEW_COLUMN_HIDDEN', () => {
    it('should update the hidden value of a column', () => {
      const initialColumnsState = Immutable.fromJS({
        tableViewColumns: [
          {
            name: 'country',
            showInCard: true,
            hidden: true,
          },
          {
            name: 'birth date',
            hidden: true,
          },
        ],
      });
      const selectableColumns = uiReducer(initialColumnsState, {
        type: types.SET_TABLE_VIEW_COLUMN_HIDDEN,
        name: 'birth date',
        hidden: false,
      }).get('tableViewColumns');
      expect(selectableColumns.get(1).get('hidden')).toBe(false);
    });
  });

  describe('SET_TABLE_VIEW_ALL_COLUMNS_HIDDEN', () => {
    it('should update the hidden value of all columns', () => {
      const initialColumnsState = Immutable.fromJS({
        tableViewColumns: [
          {
            name: 'country',
            showInCard: true,
            hidden: false,
          },
          {
            name: 'birth date',
            hidden: true,
          },
        ],
      });
      const selectableColumns = uiReducer(initialColumnsState, {
        type: types.SET_TABLE_VIEW_ALL_COLUMNS_HIDDEN,
        hidden: false,
      }).get('tableViewColumns');
      expect(selectableColumns.get(0).get('hidden')).toBe(false);
      expect(selectableColumns.get(1).get('hidden')).toBe(false);
    });
  });

  describe('UPLOADS_COMPLETE', () => {
    it('should update the documents of the selected document', () => {
      const previousState = Immutable.fromJS({
        selectedDocuments: [
          { sharedId: 'entity1', documents: [{ filename: 'file1', status: 'processing' }] },
        ],
      });
      const uploadsCompleteAction = {
        type: 'UPLOADS_COMPLETE',
        doc: 'entity1',
        files: [{ filename: 'file1', status: 'ready' }],
      };
      const newState = uiReducer(previousState, uploadsCompleteAction);
      expect(newState.toJS()).toEqual({
        selectedDocuments: [
          {
            sharedId: 'entity1',
            documents: [{ filename: 'file1', status: 'ready' }],
          },
        ],
      });
    });
  });
});
