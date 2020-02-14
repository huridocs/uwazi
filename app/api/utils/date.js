import moment from 'moment';

export default {
  currentUTC() {
    return moment
      .utc()
      .toDate()
      .getTime();
  },

  stringDateToUTCTimestamp(date) {
    return new Date(`${date} UTC`).getTime() / 1000;
  },

  descriptionToTimestamp(date) {
    if (date === 'last-day-last-month') {
      return moment
        .utc()
        .subtract(1, 'months')
        .endOf('month')
        .unix();
    }

    if (date === 'first-day-last-month') {
      return moment
        .utc()
        .subtract(1, 'months')
        .startOf('month')
        .unix();
    }

    return date;
  },
};
