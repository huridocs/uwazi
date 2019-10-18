"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _moment = _interopRequireDefault(require("moment"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  currentUTC() {
    return _moment.default.utc().toDate().getTime();
  },

  stringDateToUTCTimestamp(date) {
    return new Date(`${date} UTC`).getTime() / 1000;
  },

  descriptionToTimestamp(date) {
    if (date === 'last-day-last-month') {
      return _moment.default.utc().subtract(1, 'months').endOf('month').unix();
    }

    if (date === 'first-day-last-month') {
      return _moment.default.utc().subtract(1, 'months').startOf('month').unix();
    }

    return date;
  } };exports.default = _default;