import * as types from '../actionTypes';

import * as actions from '../actions';

fdescribe('Relationships actions', () => {
  describe('parseResults', () => {
    it('should pass action with results, parentEntity and editing boolean value', () => {
      expect(actions.parseResults('results', 'parentEntity', true))
      .toEqual({type: types.PARSE_RELATIONSHIPS_RESULTS, results: 'results', parentEntity: 'parentEntity', editing: true});
    });
  });

  describe('selectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.selectConnection('connection')).toEqual({type: 'relationships/connection/SET', value: 'connection'});
    });
  });

  describe('unselectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.unselectConnection()).toEqual({type: 'relationships/connection/SET', value: {}});
    });
  });
});
