"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));

var _uiReducer = _interopRequireDefault(require("../uiReducer"));
var actions = _interopRequireWildcard(require("../../actions/libraryActions"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('uiReducer', () => {
  const initialState = _immutable.default.fromJS({
    searchTerm: '',
    previewDoc: '',
    suggestions: [],
    selectedDocuments: [],
    filtersPanel: false,
    zoomLevel: 0 });


  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _uiReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('selectDocument', () => {
    it('should set selected document', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_DOCUMENT, doc: { _id: 'document' } });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
    });

    it('should not select an already selected document', () => {
      let newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_DOCUMENT, doc: { _id: 'document' } });
      newState = (0, _uiReducer.default)(newState, { type: types.SELECT_DOCUMENT, doc: { _id: 'document', something: 'change' } });
      expect(newState.get('selectedDocuments').size).toBe(1);
    });
  });

  describe('selectSingleDocument', () => {
    it('should set document and remove any other', () => {
      let newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_DOCUMENT, doc: { _id: 'document' } });
      newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_SINGLE_DOCUMENT, doc: { _id: 'other_document' } });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('other_document');
      expect(newState.get('selectedDocuments').size).toBe(1);
    });
  });

  describe('selectDocuments', () => {
    it('should add the documents to the selected document list', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_DOCUMENTS, docs: [{ _id: 'document' }, { _id: 'document2' }] });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
      expect(newState.get('selectedDocuments').size).toBe(2);
      expect(newState.get('selectedDocuments').last().get('_id')).toBe('document2');
    });

    it('should not select an already selected document', () => {
      let newState = (0, _uiReducer.default)(initialState, { type: types.SELECT_DOCUMENTS, docs: [{ _id: 'document' }] });
      newState = (0, _uiReducer.default)(newState, { type: types.SELECT_DOCUMENTS, docs: [{ _id: 'document' }, { _id: 'document2' }, { _id: 'document3' }] });
      expect(newState.get('selectedDocuments').first().get('_id')).toBe('document');
      expect(newState.get('selectedDocuments').size).toBe(3);
      expect(newState.get('selectedDocuments').last().get('_id')).toBe('document3');
    });
  });

  describe('unselectDocument', () => {
    it('should set selected document', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ selectedDocuments: [{ _id: 'document' }] }), actions.unselectDocument('document'));
      expect(newState.toJS().selectedDocuments.length).toBe(0);
    });
  });

  describe('unselectAllDocuments', () => {
    it('should set selected document', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ selectedDocuments: [{ _id: 'document' }] }), actions.unselectAllDocuments());
      expect(newState.toJS().selectedDocuments.length).toBe(0);
    });
  });

  describe('SET_SEARCHTERM', () => {
    it('should set the searchTerm in the state', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SET_SEARCHTERM, searchTerm: 'something cool' });
      expect(newState.toJS().searchTerm).toBe('something cool');
    });

    describe('when the searchTerm is empty', () => {
      it('should clear the suggestions', () => {
        const state = initialState.set('suggestions', ['some', 'suggestions']);
        const newState = (0, _uiReducer.default)(state, { type: types.SET_SEARCHTERM, searchTerm: '' });
        expect(newState.toJS().suggestions).toEqual([]);
      });
    });
  });

  describe('SET_SUGGESTIONS', () => {
    it('should set the suggestions in the state', () => {
      const suggestions = [{ title: 'something' }];
      const newState = (0, _uiReducer.default)(initialState, { type: types.SET_SUGGESTIONS, suggestions });
      expect(newState.get('suggestions').toJS()).toEqual(suggestions);
    });
  });

  describe('SHOW_FILTERS', () => {
    it('should set the filtersPanel to true', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SHOW_FILTERS });
      expect(newState.toJS().filtersPanel).toBe(true);
    });
  });

  describe('HIDE_FILTERS', () => {
    it('should set the filtersPanel to false', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.HIDE_FILTERS });
      expect(newState.toJS().filtersPanel).toBe(false);
    });
  });

  describe('SHOW_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SHOW_SUGGESTIONS });
      expect(newState.toJS().showSuggestions).toBe(true);
    });
  });

  describe('HIDE_SUGGESTIONS', () => {
    it('should set the showSuggestions to true', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.HIDE_SUGGESTIONS });
      expect(newState.toJS().showSuggestions).toBe(false);
    });
  });

  describe('OVER_SUGGESTIONS', () => {
    it('should set the overSuggestions to true', () => {
      let newState = (0, _uiReducer.default)(initialState, { type: types.OVER_SUGGESTIONS, hover: false });
      expect(newState.toJS().overSuggestions).toBe(false);

      newState = (0, _uiReducer.default)(initialState, { type: types.OVER_SUGGESTIONS, hover: true });
      expect(newState.toJS().overSuggestions).toBe(true);
    });
  });

  describe('SET_PREVIEW_DOC', () => {
    it('should set the searchTerm in the state', () => {
      const newState = (0, _uiReducer.default)(initialState, { type: types.SET_PREVIEW_DOC, docId: 'docId' });
      expect(newState.toJS().previewDoc).toBe('docId');
    });
  });

  describe('ZOOM_IN, ZOOM_OUT', () => {
    it('should increase or decrease the zoom level', () => {
      let changedState = (0, _uiReducer.default)(initialState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(1);
      changedState = (0, _uiReducer.default)(changedState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(2);
      changedState = (0, _uiReducer.default)(changedState.set('zoomLevel', 4), { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(3);
      changedState = (0, _uiReducer.default)(changedState, { type: types.ZOOM_IN });
      expect(changedState.get('zoomLevel')).toBe(3);
      changedState = (0, _uiReducer.default)(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(2);
      changedState = (0, _uiReducer.default)(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(1);

      changedState = (0, _uiReducer.default)(initialState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-1);
      changedState = (0, _uiReducer.default)(changedState.set('zoomLevel', -4), { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-3);
      changedState = (0, _uiReducer.default)(changedState, { type: types.ZOOM_OUT });
      expect(changedState.get('zoomLevel')).toBe(-3);
    });
  });
});