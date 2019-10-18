"use strict";var _moment = _interopRequireDefault(require("moment"));

var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));

var _fixtures = _interopRequireDefault(require("./fixtures"));
var _typeParsers = _interopRequireDefault(require("../typeParsers"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('csvLoader typeParsers', () => {
  beforeEach(async () => _testing_db.default.clearAllAndLoad(_fixtures.default));
  afterAll(async () => _testing_db.default.disconnect());

  describe('default', () => {
    it('should use text parser', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = { text_prop: 'text' };

      expect((await _typeParsers.default.default(rawEntity, templateProp))).toBe('text');
    });
  });

  describe('text', () => {
    it('should return the value', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = { text_prop: 'text' };

      expect((await _typeParsers.default.text(rawEntity, templateProp))).toBe('text');
    });
  });

  describe('link', () => {
    it('should use the text as url and label', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'http://www.url.com' };

      expect((await _typeParsers.default.link(rawEntity, templateProp))).toEqual({
        label: 'http://www.url.com',
        url: 'http://www.url.com' });

    });

    it('should return null if url is not valid', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'url' };

      expect((await _typeParsers.default.link(rawEntity, templateProp))).toBe(null);
    });

    it('should use "|" as separator for label and url', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'label|http://www.url.com' };

      expect((await _typeParsers.default.link(rawEntity, templateProp))).toEqual({
        label: 'label',
        url: 'http://www.url.com' });

    });
  });

  describe('date', () => {
    it('should parse date and return a timestamp', async () => {
      const templateProp = { name: 'date_prop' };

      let expected = await _typeParsers.default.date({ date_prop: '2014' }, templateProp);
      expect(_moment.default.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-2014');

      expected = await _typeParsers.default.date({ date_prop: '2014 11 6' }, templateProp);
      expect(_moment.default.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('06-11-2014');

      expected = await _typeParsers.default.date({ date_prop: '1/1/1996 00:00:00' }, templateProp);
      expect(_moment.default.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');

      expected = await _typeParsers.default.date({ date_prop: '1/1/1996 23:59:59' }, templateProp);
      expect(_moment.default.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');
    });
  });
});