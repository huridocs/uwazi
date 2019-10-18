"use strict";var _moment = _interopRequireDefault(require("moment"));

var _date = _interopRequireDefault(require("../date"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('date helper', () => {
  describe('descriptionToTimestamp', () => {
    it('should return date if it is already a timestamp', () => {
      const timestamp = (0, _moment.default)().unix();
      expect(_date.default.descriptionToTimestamp(timestamp)).toBe(timestamp);
    });

    it('transform "first-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue((0, _moment.default)('2018-07-04'));

      expect(_date.default.descriptionToTimestamp('first-day-last-month')).
      toBe(_moment.default.utc('2018-06-01').unix());
    });

    it('transform "last-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue((0, _moment.default)('2018-07-04'));

      expect(_date.default.descriptionToTimestamp('last-day-last-month')).
      toBe(_moment.default.utc('2018-06-30T23:59:59').unix());
    });
  });
});