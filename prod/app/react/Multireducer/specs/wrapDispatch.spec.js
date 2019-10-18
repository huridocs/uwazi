"use strict";var _wrapDispatch = _interopRequireDefault(require("../wrapDispatch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('warpDispatch', () => {
  const reducerKey = 'customKey';
  const dispatch = jasmine.createSpy('dispatch');

  const wrapedDispatch = (0, _wrapDispatch.default)(dispatch, reducerKey);
  it('should add the reducerKey to actions', () => {
    const action = { type: 'PUSH' };
    const expectedAction = { type: 'PUSH', __reducerKey: reducerKey };
    wrapedDispatch(action);
    expect(dispatch).toHaveBeenCalledWith(expectedAction);
  });

  describe('when the action is a function', () => {
    it('should call the function with a wrapedDispatch', () => {
      const action = _dispatch => _dispatch({ type: 'PUSH' });
      const expectedAction = { type: 'PUSH', __reducerKey: reducerKey };
      wrapedDispatch(action);
      expect(dispatch).toHaveBeenCalledWith(expectedAction);
    });
  });
});