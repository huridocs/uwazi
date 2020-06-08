import { parseQuery } from '../parseQueryMiddleware';
import { Request, Response } from 'express';

describe('parseQueryMiddleware', () => {
  it('should parse all the properties in the query object', () => {
    const next = jest.fn();
    const req = {
      query: {
        boolean: 'true',
        object: '{"pa_s":{"values":["mu3v68ugv448ia4i"]}}',
        string: 'yay!',
        stringBolean: '"true"',
        array: '["shrimps","garlic","onion","olive oil","pepper","pasta"]',
      },
    } as Request;

    parseQuery(req, {} as Response, next);

    expect(req.query).toEqual({
      boolean: true,
      object: { pa_s: { values: ['mu3v68ugv448ia4i'] } },
      string: 'yay!',
      stringBolean: 'true',
      array: ['shrimps', 'garlic', 'onion', 'olive oil', 'pepper', 'pasta'],
    });

    expect(next).toHaveBeenCalled();
  });
});
