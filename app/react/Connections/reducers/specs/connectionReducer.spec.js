import {fromJS as Immutable} from 'immutable';
import 'jasmine-immutablejs-matchers';

import reducer from '../connectionReducer';

describe('Connections connection reducer', () => {
  describe('when state is undefined', () => {
    it('should return a default state', () => {
      let newState = reducer();
      expect(newState.toJS()).toEqual({template: '', targetDocument: '', sourceDocument: ''});
    });
  });

  describe('OPEN_CONNECTION_PANEL', () => {
    it('should reset most properties and set type and source', () => {
      const previousState = {template: 'r1', targetDocument: 't1', sourceDocument: 's1'};
      const action = {type: 'OPEN_CONNECTION_PANEL', connectionType: 'connectionType', sourceDocument: 'sourceId'};
      const newState = reducer(Immutable(previousState), action);
      const expectedState = {
        template: '',
        targetDocument: '',
        sourceDocument: 'sourceId',
        type: 'connectionType'
      };
      expect(newState.toJS()).toEqual(expectedState);
    });
  });

  describe('SET_RELATION_TYPE', () => {
    it('should set relation type', () => {
      const newState = reducer(Immutable({}), {type: 'SET_RELATION_TYPE', template: 'template_id1'});
      expect(newState.toJS()).toEqual({template: 'template_id1'});
    });
  });

  describe('SET_TARGET_DOCUMENT', () => {
    it('should set the target document', () => {
      const newState = reducer(Immutable({}), {type: 'SET_TARGET_DOCUMENT', id: 'targetId'});
      expect(newState.toJS()).toEqual({targetDocument: 'targetId'});
    });
  });

  describe('When setting the search results', () => {
    it('should keep targetDocument if id within new results', () => {
      const results = [{sharedId: '1'}, {sharedId: '3'}];
      const newState = reducer(Immutable({targetDocument: '3'}), {type: 'connections/searchResults/SET', value: results});
      expect(newState.toJS()).toEqual({targetDocument: '3'});
    });

    it('should delete targetDocument if id not within new results', () => {
      const results = [{sharedId: '1'}, {sharedId: '3'}];
      const newState = reducer(Immutable({targetDocument: '2'}), {type: 'connections/searchResults/SET', value: results});
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('Viewer SET_SELECTION', () => {
    it('should set the sourceRange', () => {
      const newState = reducer(Immutable({}), {type: 'SET_SELECTION', sourceRange: 'sourceRange'});
      expect(newState.toJS()).toEqual({sourceRange: 'sourceRange'});
    });
  });

  describe('Viewer UNSET_SELECTION', () => {
    it('should unset the sourceRange', () => {
      const newState = reducer(Immutable({sourceRange: 'sourceRange'}), {type: 'UNSET_SELECTION'});
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('Viewer CONNECTION_CREATED', () => {
    it('should unset the sourceRange', () => {
      const newState = reducer(Immutable({sourceRange: 'sourceRange'}), {type: 'CONNECTION_CREATED'});
      expect(newState.toJS()).toEqual({});
    });
  });
});
