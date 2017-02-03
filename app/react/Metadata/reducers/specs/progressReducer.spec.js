import Immutable from 'immutable';
import * as types from 'app/Metadata/actions/actionTypes';

import progressReducer from 'app/Metadata/reducers/progressReducer';
import 'jasmine-immutablejs-matchers';

describe('metadataReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('should return default state', () => {
      let newState = progressReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('START_REUPLOAD_DOCUMENT', () => {
    it('should set the progress for the document to 0', () => {
      let currentState = Immutable.fromJS({doc1: 45});
      let newState = progressReducer(currentState, {type: types.START_REUPLOAD_DOCUMENT, doc: 'doc2'});
      expect(newState).toEqualImmutable(Immutable.fromJS({doc1: 45, doc2: 0}));
    });
  });

  describe('REUPLOAD_PROGRESS', () => {
    it('should set the progress for a document', () => {
      let currentState = Immutable.fromJS({doc1: 45});
      let newState = progressReducer(currentState, {type: types.REUPLOAD_PROGRESS, doc: 'doc2', progress: 36});
      expect(newState).toEqualImmutable(Immutable.fromJS({doc1: 45, doc2: 36}));
    });
  });

  describe('REUPLOAD_COMPLETE', () => {
    it('should unset upload progress for the document', () => {
      let currentState = Immutable.fromJS({doc1: 45, doc2: 55});
      let newState = progressReducer(currentState, {type: types.REUPLOAD_COMPLETE, doc: 'doc1'});
      expect(newState).toEqualImmutable(Immutable.fromJS({doc2: 55}));
    });
  });
});
