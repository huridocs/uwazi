/** @format */

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

  describe('using JOI schema', () => {
    it('should call next when body or query is valid', () => {
      const schema = Joi.object().keys({
        prop1: Joi.string(),
        prop2: Joi.number(),
      });

      req.body = { prop1: 'string', prop2: 25 };
      middleware(schema)(req, res, next);
      expect(next).toHaveBeenCalledWith();

      req.query = { prop1: 'string', prop2: 25 };
      middleware(schema, 'query')(req, res, next);
      expect(next).toHaveBeenCalledWith();
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

  describe('using AJV schema', () => {
    it('should call next when body or query is valid', async () => {
      const schema = {
        properties: {
          body: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
          query: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
        },
      };

      req.body = { prop1: 'string', prop2: 25 };
      await middleware(schema)(req, res, next);
      expect(next).toHaveBeenCalledWith();

      next.calls.reset();
      req.query = { prop1: 'string', prop2: 25 };
      await middleware(schema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with the error', async () => {
      const schema = {
        properties: {
          body: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
        },
      };

      req.body = { prop1: 55, prop2: 'must be number' };
      await middleware(schema)(req, res, next);
      expect(next.calls.argsFor(0)).toMatchSnapshot();
    });
  });
});
