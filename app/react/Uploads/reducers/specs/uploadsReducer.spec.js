import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import uploadsReducer from 'app/Uploads/reducers/uploadsReducer';
import 'jasmine-immutablejs-matchers';

describe('uploadsReducer', () => {
  const initialState = Immutable.fromJS([]);

  describe('when state is undefined', () => {
    it('returns default state', () => {
      let newState = uploadsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('UPDATE_DOCUMENT', () => {
    it('should update the document with document passed', () => {
      let state = Immutable.fromJS([
        {sharedId: 1, title: 'Song of Ice and Fire: The Winds of Winter'},
        {sharedId: 2, title: 'Song of Ice and Fire: A Dream of Spring'}
      ]);
      let doc = {sharedId: 2, metadata: {test: 'test'}};
      let newState = uploadsReducer(state, {type: types.UPDATE_DOCUMENT, doc});
      let expected = Immutable.fromJS([
        {sharedId: 1, title: 'Song of Ice and Fire: The Winds of Winter'},
        {sharedId: 2, metadata: {test: 'test'}, title: 'Song of Ice and Fire: A Dream of Spring'}
      ]);
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SET_UPLOADS', () => {
    it('should set the documents in the state', () => {
      let documents = [{title: 'Song of Ice and Fire: The Winds of Winter'}, {title: 'Song of Ice and Fire: A Dream of Spring'}];
      let newState = uploadsReducer(initialState, {type: types.SET_UPLOADS, documents});
      expect(newState).toEqualImmutable(Immutable.fromJS(documents));
    });
  });

  describe('ELEMENT_CREATED', () => {
    it('should insert the new document and sort documents by date', () => {
      let currentState = Immutable.fromJS([{title: '1', creationDate: 25}, {title: '2', creationDate: 35}]);
      let doc = {title: '3', creationDate: 15};
      currentState = uploadsReducer(currentState, {type: types.ELEMENT_CREATED, doc});

      let anotherDoc = {title: '4', creationDate: 50};
      let newState = uploadsReducer(currentState, {type: types.ELEMENT_CREATED, doc: anotherDoc});
      expect(newState).toEqualImmutable(Immutable.fromJS([
        {title: '4', creationDate: 50},
        {title: '2', creationDate: 35},
        {title: '1', creationDate: 25},
        {title: '3', creationDate: 15}
      ]));
    });
  });

  describe('UPLOAD_COMPLETE', () => {
    it('should set uploaded flag to true for the document', () => {
      let currentState = Immutable.fromJS([{sharedId: 'id1', title: '1'}, {sharedId: 'id2', title: '2'}]);
      let newState = uploadsReducer(currentState, {type: types.UPLOAD_COMPLETE, doc: 'id2'});
      expect(newState.toJS()).toEqual([{sharedId: 'id1', title: '1'}, {sharedId: 'id2', title: '2', uploaded: true}]);
    });
  });
  describe('CONVERSION_COMPLETE', () => {
    it('should set processed flag to true for the document', () => {
      let currentState = Immutable.fromJS([{_id: 'id1', title: '1'}, {_id: 'id2', title: '2'}]);
      let newState = uploadsReducer(currentState, {type: types.CONVERSION_COMPLETE, doc: 'id2'});
      expect(newState.toJS()).toEqual([{_id: 'id1', title: '1'}, {_id: 'id2', title: '2', processed: true}]);
    });
  });

  describe('MOVED_TO_LIBRARY', () => {
    it('should remove it from the state', () => {
      let currentState = Immutable.fromJS([{_id: 'id1', title: '1'}, {_id: 'id2', title: '2'}]);
      let newState = uploadsReducer(currentState, {type: types.MOVED_TO_LIBRARY, doc: 'id2'});
      expect(newState.toJS()).toEqual([{_id: 'id1', title: '1'}]);
    });
  });

  describe('ELEMENT_DELETED', () => {
    it('should remove it from the state', () => {
      let currentState = Immutable.fromJS([{_id: 'id1', title: '1'}, {_id: 'id2', title: '2'}]);
      let newState = uploadsReducer(currentState, {type: types.ELEMENT_DELETED, doc: 'id2'});
      expect(newState.toJS()).toEqual([{_id: 'id1', title: '1'}]);
    });
  });
});
