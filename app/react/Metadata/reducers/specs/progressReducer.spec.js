import Immutable from 'immutable';
import * as types from 'app/Metadata/actions/actionTypes';

import progressReducer from 'app/Metadata/reducers/progressReducer';

describe('metadataReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('should return default state', () => {
      const newState = progressReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('START_REUPLOAD_DOCUMENT', () => {
    it('should set the progress for the document to 0', () => {
      const currentState = Immutable.fromJS({ doc1: 45 });
      const newState = progressReducer(currentState, {
        type: types.START_REUPLOAD_DOCUMENT,
        doc: 'doc2',
      });
      expect(newState.toJS()).toEqual({ doc1: 45, doc2: 0 });
    });
  });

  describe('REUPLOAD_PROGRESS', () => {
    it('should set the progress for a document', () => {
      const currentState = Immutable.fromJS({ doc1: 45 });
      const newState = progressReducer(currentState, {
        type: types.REUPLOAD_PROGRESS,
        doc: 'doc2',
        progress: 36,
      });
      expect(newState.toJS()).toEqual({ doc1: 45, doc2: 36 });
    });
  });

  describe('REUPLOAD_COMPLETE', () => {
    it('should unset upload progress for the document', () => {
      const currentState = Immutable.fromJS({ doc1: 45, doc2: 55 });
      const newState = progressReducer(currentState, {
        type: types.REUPLOAD_COMPLETE,
        doc: 'doc1',
      });
      expect(newState.toJS()).toEqual({ doc2: 55 });
    });
  });
});
