import sanitizeResponse from '../sanitizeResponse';

describe('sanitizeResponse', () => {
  it('should sanitize a database response so every row is the \'value\' property of each row', () => {
    let dbResult = {rows: [{value: {id: 1, name: 'batman'}}, {value: {id: 2, name: 'robin'}}]};
    let expected = {rows: [{id: 1, name: 'batman'}, {id: 2, name: 'robin'}]};

    expect(sanitizeResponse(dbResult)).toEqual(expected);
  });
});
