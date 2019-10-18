"use strict";var _joi = _interopRequireDefault(require("joi"));

var _validateRequest = _interopRequireDefault(require("../validateRequest.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('validateRequest', () => {
  let next;
  let res;
  const req = {};

  beforeEach(() => {
    next = jasmine.createSpy('next');
    res = {
      json: jasmine.createSpy('json'),
      status: jasmine.createSpy('status'),
      error: jasmine.createSpy('error') };

  });

  it('should call next when body or query is valid', () => {
    const schema = _joi.default.object().keys({
      prop1: _joi.default.string(),
      prop2: _joi.default.number() });


    req.body = { prop1: 'string', prop2: 25 };
    (0, _validateRequest.default)(schema)(req, res, next);
    expect(next).toHaveBeenCalled();

    req.query = { prop1: 'string', prop2: 25 };
    (0, _validateRequest.default)(schema, 'query')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next with the error', () => {
    const schema = _joi.default.object().keys({
      prop1: _joi.default.string(),
      prop2: _joi.default.number() });


    req.body = { prop1: 55, prop2: 'must be number' };
    (0, _validateRequest.default)(schema)(req, res, next);
    expect(next.calls.argsFor(0)).toMatchSnapshot();
  });
});