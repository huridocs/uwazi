"use strict";var _immutable = require("immutable");
var _multireducer = _interopRequireDefault(require("../multireducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('multireducer', () => {
  const reducerKey = 'customKey';
  const testReducer = (state = [], action) => {
    if (action.type === 'PUSH') {
      return state.push(action.value);
    }

    return (0, _immutable.fromJS)(state);
  };
  const wrapedReducer = (0, _multireducer.default)(testReducer, reducerKey);

  it('should execute actions with the customKey', () => {
    const action = { type: 'PUSH', value: '123', __reducerKey: 'customKey' };
    const resultState = wrapedReducer((0, _immutable.fromJS)([]), action);
    expect(resultState).toEqualImmutable((0, _immutable.fromJS)(['123']));
  });

  it('should not execute actions without the customKey', () => {
    const action = { type: 'PUSH', value: '123' };
    const resultState = wrapedReducer((0, _immutable.fromJS)([]), action);
    expect(resultState).toEqualImmutable((0, _immutable.fromJS)([]));
  });

  it('should execute @@redux/INIT action and return the state', () => {
    const action = { type: '@@redux/INIT' };
    const resultState = wrapedReducer([], action);
    expect(resultState).toEqual((0, _immutable.fromJS)([]));
  });

  describe('when the state is undefined and the action should not pass', () => {
    it('should return the initial state', () => {
      const action = { type: 'PUSH' };
      let undefState;
      const resultState = wrapedReducer(undefState, action);
      expect(resultState).toEqual((0, _immutable.fromJS)([]));
    });
  });
});