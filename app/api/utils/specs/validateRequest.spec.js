import Joi from 'joi';

import middleware from '../validateRequest.js';

describe('validateRequest', () => {
  let next;
  let res;
  const req = {};

  beforeEach(() => {
    next = jest.fn();
    res = {
      json: jest.fn(),
      status: jest.fn(),
      error: jest.fn(),
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

      expect(next.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('using AJV schema', () => {
    it('should call next when body or query is valid', async () => {
      const schema = {
        type: 'object',
        properties: {
          body: {
            type: 'object',
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
          query: {
            type: 'object',
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

      next.mockReset();
      req.query = { prop1: 'string', prop2: 25 };
      await middleware(schema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with the error', async () => {
      const schema = {
        type: 'object',
        properties: {
          body: {
            type: 'object',
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
        },
      };

      req.body = { prop1: 55, prop2: 'must be number' };
      await middleware(schema)(req, res, next);
      const expected = expect.objectContaining({
        message: 'validation failed',
        errors: [
          expect.objectContaining({ message: 'must be string' }),
          expect.objectContaining({ message: 'must be number' }),
        ],
        code: 400,
      });
      expect(next.mock.calls[0]).toEqual([expected]);
    });
  });
});
