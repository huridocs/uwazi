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

  stripStopwords(parsedValue, locale) {
    const { removeStopwords, ...languages } = stopword;
    if (!locale) {
      return parsedValue;
    }

    return removeStopwords(parsedValue.split(' '), languages[locale]).join(' ');
  },

  dateToSeconds(value, locale) {
    //Remove diacritics
    const normalizedValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    //Remove stopwords
    const originalValueWithoutStopwords = this.stripStopwords(value, locale);
    //Remove stopwords and diacritics
    const normalizedValueWithoutStopwords = this.stripStopwords(normalizedValue, locale);

    const parsingAttempts = [
      value,
      originalValueWithoutStopwords,
      normalizedValue,
      normalizedValueWithoutStopwords,
    ];

    for (const parsedValue of parsingAttempts) {
      let getDate = parser.fromString(parsedValue, locale);

      if (!getDate.invalid) {
        return getDate / 1000;
      }

      getDate = Date.parse(`${parsedValue} GMT`);
      if (!Number.isNaN(getDate)) {
        return getDate / 1000;
      }
    }

    return NaN;
  },
};
