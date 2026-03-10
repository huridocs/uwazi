import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';
import * as uploadTypes from 'app/Uploads/actions/actionTypes';

const initialState = Immutable.fromJS({
  searchTerm: '',
  previewDoc: '',
  suggestions: [],
  selectedDocuments: [],
  filtersPanel: false,
  zoomLevel: 0,
  tableViewColumns: [],
});

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_SEARCHTERM) {
    let newState = state.set('searchTerm', action.searchTerm);
    if (!action.searchTerm) {
      newState = newState.set('suggestions', []);
    }
    return newState;
  }

  if (action.type === types.SELECT_DOCUMENT) {
    const alreadySelected = state
      .get('selectedDocuments')
      .filter(doc => doc.get('_id') === action.doc._id).size;
    if (!alreadySelected) {
      return state.update('selectedDocuments', selectedDocuments =>
        selectedDocuments.push(Immutable.fromJS(action.doc))
      );
    }

    return state;
  }

  if (action.type === types.SELECT_SINGLE_DOCUMENT) {
    const doc = Immutable.fromJS(action.doc);
    return state.update('selectedDocuments', () => Immutable.fromJS([doc]));
  }

  if (action.type === uploadTypes.UPLOAD_COMPLETE) {
    const docIndex = state
      .get('selectedDocuments')
      .findIndex(doc => doc.get('sharedId') === action.doc);

    if (docIndex >= 0) {
      const doc = state.get('selectedDocuments').get(docIndex).toJS();
      doc.documents.push(action.file);

      return state.setIn(['selectedDocuments', docIndex], Immutable.fromJS(doc));
    }
  }

  if (action.type === uploadTypes.UPLOADS_COMPLETE) {
    const docIndex = state
      .get('selectedDocuments')
      .findIndex(doc => doc.get('sharedId') === action.doc);

    if (docIndex >= 0) {
      const doc = state.get('selectedDocuments').get(docIndex).toJS();
      return state.setIn(
        ['selectedDocuments', docIndex],
        Immutable.fromJS({ ...doc, documents: action.files })
      );
    }
  }

  if (action.type === types.SELECT_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const alreadySelected = _state
        .get('selectedDocuments')
        .filter(_doc => _doc.get('_id') === doc._id).size;
      if (!alreadySelected) {
        return _state.update('selectedDocuments', selectedDocuments =>
          selectedDocuments.push(Immutable.fromJS(doc))
        );
      }
      return _state;
    }, state);
  }

  if (action.type === types.UNSELECT_DOCUMENT) {
    return state.update('selectedDocuments', selectedDocuments =>
      selectedDocuments.filter(doc => doc.get('_id') !== action.docId)
    );
  }

  if (action.type === types.UNSELECT_ALL_DOCUMENTS) {
    return state.set('selectedDocuments', Immutable.fromJS([]));
  }

  if (action.type === types.UPDATE_SELECTED_ENTITIES) {
    return state.set('selectedDocuments', action.entities);
  }

  if (action.type === types.HIDE_FILTERS) {
    return state.set('filtersPanel', false);
  }

  if (action.type === types.SHOW_FILTERS) {
    return state.set('filtersPanel', true);
  }

  if (action.type === types.SET_PREVIEW_DOC) {
    return state.set('previewDoc', action.docId);
  }

  if (action.type === types.SET_SUGGESTIONS) {
    return state.set('suggestions', Immutable.fromJS(action.suggestions));
  }

  if (action.type === types.SHOW_SUGGESTIONS) {
    return state.set('showSuggestions', true);
  }

  if (action.type === types.HIDE_SUGGESTIONS) {
    return state.set('showSuggestions', false);
  }

  if (action.type === types.OVER_SUGGESTIONS) {
    return state.set('overSuggestions', action.hover);
  }

  if (action.type === types.ZOOM_IN) {
    const maxLevel = 3;
    return state.set('zoomLevel', Math.min(state.get('zoomLevel') + 1, maxLevel));
  }

  if (action.type === types.ZOOM_OUT) {
    const minLevel = -3;
    return state.set('zoomLevel', Math.max(state.get('zoomLevel') - 1, minLevel));
  }

  if (action.type === types.SET_TABLE_VIEW_COLUMNS) {
    if (action.columns.length === 0) {
      return state;
    }
    const columnsWithSelection = action.columns.map(column => {
      const previousColumnState = state
        .get('tableViewColumns')
        .find(c => c.get('name') === column.name);

      const previousHidden =
        previousColumnState && previousColumnState.has('hidden')
          ? previousColumnState.get('hidden')
          : column.hidden;
      const hidden = previousHidden !== undefined ? previousHidden : !column.showInCard;

      return Object.assign(column, { hidden });
    });

    return state.set('tableViewColumns', Immutable.fromJS(columnsWithSelection));
  }

  if (action.type === types.SET_TABLE_VIEW_COLUMN_HIDDEN) {
    const index = state.get('tableViewColumns').findIndex(c => c.get('name') === action.name);
    return state.setIn(['tableViewColumns', index, 'hidden'], action.hidden);
  }

  if (action.type === types.SET_TABLE_VIEW_ALL_COLUMNS_HIDDEN) {
    return state.update('tableViewColumns', columns =>
      columns.map((c, index) => (index ? c.set('hidden', action.hidden) : c))
    );
  }

  return Immutable.fromJS(state);
}
