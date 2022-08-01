import moment from 'moment';
// @ts-ignore
import parser from 'any-date-parser';

export default {
  currentUTC() {
    return moment.utc().toDate().getTime();
  },

  descriptionToTimestamp(date) {
    if (date === 'last-day-last-month') {
      return moment.utc().subtract(1, 'months').endOf('month').unix();
    }

    if (date === 'first-day-last-month') {
      return moment.utc().subtract(1, 'months').startOf('month').unix();
    }

    return date;
  },

  addYearsToCurrentDate(yearsToAdd) {
    const newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    newDate.setFullYear(newDate.getFullYear() + yearsToAdd);
    return newDate;
  },

  dateToSeconds(value, locale) {
    const parsedValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let getDate = parser.fromString(parsedValue, locale);
    if (getDate.invalid) {
      getDate = Date.parse(`${parsedValue} GMT`);
    }
    const formattedDate = getDate / 1000;
    return formattedDate;
  },
};
