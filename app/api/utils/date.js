import moment from 'moment';
// @ts-ignore
import parser from 'any-date-parser';
import * as stopword from 'stopword';

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
    let parsedValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const { removeStopwords, ...languages } = stopword;

    if (locale) {
      parsedValue = removeStopwords(parsedValue.split(' '), languages[locale]).join(' ');
    }

    let getDate = parser.fromString(parsedValue, locale);
    if (getDate.invalid) {
      getDate = Date.parse(`${parsedValue} GMT`);
    }
    const formattedDate = getDate / 1000;
    return formattedDate;
  },
};
