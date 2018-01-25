import * as actions from '../actions';

describe('ConnectionsList actions', () => {
  describe('selectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.selectConnection('connection')).toEqual({type: 'connectionsList/connection/SET', value: 'connection'});
    });
  });

  describe('unselectConnection', () => {
    it('should set the connection in the state', () => {
      expect(actions.unselectConnection()).toEqual({type: 'connectionsList/connection/SET', value: {}});
    });
  });
});
