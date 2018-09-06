import Joi from 'joi';

import middleware from '../validateRequest.js';

describe('validateRequest', () => {
  let next;
  let res;
  const req = {};

  beforeEach(() => {
    next = jasmine.createSpy('next');
    res = {
      json: jasmine.createSpy('json'),
      status: jasmine.createSpy('status'),
      error: jasmine.createSpy('error'),
    };
  });

  it('should call next when body or query is valid', () => {
    const schema = Joi.object().keys({
      prop1: Joi.string(),
      prop2: Joi.number(),
    });

    req.body = { prop1: 'string', prop2: 25 };
    middleware(schema)(req, res, next);
    expect(next).toHaveBeenCalled();

    req.query = { prop1: 'string', prop2: 25 };
    middleware(schema, 'query')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next with the error', () => {
    const schema = Joi.object().keys({
      prop1: Joi.string(),
      prop2: Joi.number(),
    });

    req.body = { prop1: 55, prop2: 'must be number' };
    middleware(schema)(req, res, next);
    expect(next.calls.argsFor(0)).toMatchSnapshot();
  });
});
