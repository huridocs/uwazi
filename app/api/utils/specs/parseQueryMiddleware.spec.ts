import { Response } from 'express';
import { parseQuery } from '../parseQueryMiddleware';

describe('parseQueryMiddleware', () => {
  it('should parse all the properties in the query object but pure strings', () => {
    const next = jest.fn();
    const req = {
      query: {
        boolean: 'true',
        object: '{"pa_s":{"values":["mu3v68ugv448ia4i"]}}',
        string: 'yay!',
        stringBolean: '"true"',
        array: '["shrimps","garlic","onion","olive oil","pepper","pasta"]',
        searchTerm: '"this is known to be a string"',
      },
    };

    // @ts-ignore
    parseQuery(req, {} as Response, next);

    expect(req.query).toEqual({
      boolean: true,
      object: { pa_s: { values: ['mu3v68ugv448ia4i'] } },
      string: 'yay!',
      stringBolean: 'true',
      array: ['shrimps', 'garlic', 'onion', 'olive oil', 'pepper', 'pasta'],
      searchTerm: '"this is known to be a string"',
    });

    expect(next).toHaveBeenCalled();
  });
});
