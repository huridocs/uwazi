import createReducer, * as actions from 'app/BasicReducer/reducer';
import {fromJS as Immutable} from 'immutable';

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

  describe('Push', () => {
    it('should add an element to an array', () => {
      let reducer1 = createReducer('namespace1', []);
      let reducer2 = createReducer('namespace2', []);

      let newState1 = reducer1(Immutable([{_id: '1'}]), actions.push('namespace1', {_id: '2'}));
      let newState2 = reducer2(Immutable([{_id: '1'}]), actions.push('namespace1', {_id: '2'}));

      expect(newState1.toJS()).toEqual([{_id: '1'}, {_id: '2'}]);
      expect(newState1.get(1).toJS()).toEqual({_id: '2'});
      expect(newState2.toJS()).toEqual([{_id: '1'}]);
    });
  });

  describe('Delete', () => {
    it('should delete an element from the array based on the id', () => {
      let reducer1 = createReducer('namespace1', []);
      let reducer2 = createReducer('namespace2', []);

      let newState1 = reducer1([{_id: '1'}, {_id: '2'}, {_id: '3'}], actions.remove('namespace1', {_id: '2'}));
      let newState2 = reducer2([{_id: '2'}], actions.remove('namespace1', {_id: '2'}));

      expect(newState1.toJS()).toEqual([{_id: '1'}, {_id: '3'}]);
      expect(newState2.toJS()).toEqual([{_id: '2'}]);
    });
  });
});
