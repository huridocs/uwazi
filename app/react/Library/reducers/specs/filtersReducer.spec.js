import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';
import 'jasmine-immutablejs-matchers';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({templates: [], properties: [], allDocumentTypes: true});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = filtersReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_TEMPLATES', () => {
    let templates = [
      {_id: 'cba2', properties: [
        {name: 'author', filter: false, type: 'text'},
        {name: 'country', filter: true, type: 'select', content: 'abc1'}
      ]},
      {_id: 'abc1', properties: [
        {name: 'author', filter: false, type: 'text'},
        {name: 'country', filter: true, type: 'select', content: 'abc1'}
      ]}
    ];

    let thesauris = [{_id: 'abc1', values: ['thesauri values']}];

    it('should set the templates in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris});
      expect(newState.toJS().templates).toEqual(templates);
    });

    it('should set the thesauris in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris});
      expect(newState.toJS().thesauris).toEqual(thesauris);
    });

    it('should set an object with each templateid to be used as doctype filter flags', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris});
      expect(newState.toJS().documentTypes).toEqual({cba2: true, abc1: true});
      expect(newState.toJS().allDocumentTypes).toBe(true);
    });

    it('should set an object with the properties to be used as filters', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris});
      expect(newState.toJS().properties).toEqual([{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']}]);
    });
  });

  describe('TOGGLE_FILTER_DOCUMENT_TYPE', () => {
    it('should change the state of the given docType to the oposite', () => {
      const state = Immutable.fromJS({documentTypes: {a: true, b: false}, templates: [], thesauris: []});

      let newState = filtersReducer(state, {type: types.TOGGLE_FILTER_DOCUMENT_TYPE, documentType: 'a'});
      expect(newState.toJS().documentTypes.a).toBe(false);
    });

    it('should change "allDocumentTypes" to true if all are true', () => {
      const state = Immutable.fromJS({documentTypes: {a: true, b: true, c: false}, templates: [], thesauris: []});

      let newState = filtersReducer(state, {type: types.TOGGLE_FILTER_DOCUMENT_TYPE, documentType: 'c'});
      expect(newState.toJS().allDocumentTypes).toBe(true);
    });

    it('should change "allDocumentTypes" to false if any are false', () => {
      const state = Immutable.fromJS({documentTypes: {a: true, b: true, c: true}, templates: [], thesauris: []});

      let newState = filtersReducer(state, {type: types.TOGGLE_FILTER_DOCUMENT_TYPE, documentType: 'c'});
      expect(newState.toJS().allDocumentTypes).toBe(false);
    });
  });

  describe('TOGGLE_ALL_FILTER_DOCUMENT_TYPE', () => {
    it('should togle "allDocumentTypes" and every documentType to the same state', () => {
      const state = Immutable.fromJS({templates: [{_id: 'a', properties: []}, {_id: 'b', properties: []}],
                                      thesauris: [],
                                      documentTypes: {a: false, b: true},
                                      allDocumentTypes: false});

      let newState = filtersReducer(state, {type: types.TOGGLE_ALL_FILTER_DOCUMENT_TYPE});
      expect(newState.toJS().allDocumentTypes).toBe(true);
      expect(newState.toJS().documentTypes.a).toBe(true);
      expect(newState.toJS().documentTypes.b).toBe(true);
    });
  });
});
