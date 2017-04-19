import multireducer from '../multireducer';
import {fromJS as Immutable} from 'immutable';

fdescribe('multireducer', () => {
  const reducerKey = 'customKey';
  const testReducer = (state = [], action) => {
    if (action.type === 'PUSH') {
      return state.push(action.value);
    }

    return Immutable(state);
  };
  const wrapedReducer = multireducer(testReducer, reducerKey);

  it('should execute actions with the customKey', () => {
    const action = {type: 'PUSH', value: '123', __reducerKey: 'customKey'};
    const resultState = wrapedReducer(Immutable([]), action);
    expect(resultState).toEqualImmutable(Immutable(['123']));
  });

  it('should not execute actions without the customKey', () => {
    const action = {type: 'PUSH', value: '123'};
    const resultState = wrapedReducer(Immutable([]), action);
    expect(resultState).toEqualImmutable(Immutable([]));
  });

  it('should execute @@redux/INIT action and return the state', () => {
    const action = {type: '@@redux/INIT'};
    const resultState = wrapedReducer([], action);
    expect(resultState).toEqual(Immutable([]));
  });

  describe('when the state is undefined and the action should not pass', () => {
    it('should return the initial state', () => {
      const action = {type: 'PUSH'};
      let undefState;
      const resultState = wrapedReducer(undefState, action);
      expect(resultState).toEqual(Immutable([]));
    });
  });
});
