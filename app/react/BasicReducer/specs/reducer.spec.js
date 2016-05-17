import createReducer, * as actions from 'app/BasicReducer/reducer';

describe('BasicReducer', () => {
  describe('createReducer', () => {
    it('should return a reducer function with default value passed', () => {
      let reducer = createReducer('namespace', {});
      let newState = reducer();
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('Set', () => {
    it('should set value passed on the same namespace', () => {
      let reducer1 = createReducer('1');
      let reducer2 = createReducer('2');

      let newState1 = reducer1({}, actions.set('1', {newValue: 'value'}));
      let newState2 = reducer2({}, actions.set('1', {newValue: 'value'}));

      expect(newState1.toJS()).toEqual({newValue: 'value'});
      expect(newState2.toJS()).toEqual({});
    });
  });

  describe('Unset', () => {
    it('should set value passed on the same namespace', () => {
      let reducer1 = createReducer('1', {});
      let reducer2 = createReducer('2', {});

      let newState1 = reducer1({defaultValue: 'default'}, actions.unset('1'));
      let newState2 = reducer2({defaultValue: 'default'}, actions.unset('1'));

      expect(newState1.toJS()).toEqual({});
      expect(newState2.toJS()).toEqual({defaultValue: 'default'});
    });
  });
});
