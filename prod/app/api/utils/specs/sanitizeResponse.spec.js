"use strict";var _sanitizeResponse = _interopRequireDefault(require("../sanitizeResponse"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('sanitizeResponse', () => {
  it('should sanitize a database response so every row is the \'value\' property of each row', () => {
    const dbResult = { rows: [{ value: { id: 1, name: 'batman' } }, { value: { id: 2, name: 'robin' } }] };
    const expected = { rows: [{ id: 1, name: 'batman' }, { id: 2, name: 'robin' }] };

    expect((0, _sanitizeResponse.default)(dbResult)).toEqual(expected);
  });
});