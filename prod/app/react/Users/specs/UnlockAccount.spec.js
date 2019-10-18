"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactRouter = require("react-router");

var _UnlockAccount = require("../UnlockAccount");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('UnlockAccount', () => {
  let props;
  let context;

  beforeEach(() => {
    spyOn(_reactRouter.browserHistory, 'push');
    props = {
      unlockAccount: jest.fn().mockResolvedValue(),
      params: { username: 'username', code: 'code' } };


    context = { store: { getState: () => ({}) }, router: { location: '' } };
  });

  const renderComponent = () => (0, _enzyme.shallow)(_react.default.createElement(_UnlockAccount.UnlockAccount, props), { context });

  it('should call unlockAccount with params', done => {
    renderComponent();
    setImmediate(() => {
      expect(props.unlockAccount).toHaveBeenCalledWith(props.params);
      done();
    });
  });

  it('should redirect to login on success', done => {
    renderComponent();
    setImmediate(() => {
      expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('/login');
      done();
    });
  });

  it('should redirect to login on failure', done => {
    props.resetPassword = jest.fn().mockRejectedValue('error');
    renderComponent();
    setImmediate(() => {
      expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('/login');
      done();
    });
  });
});