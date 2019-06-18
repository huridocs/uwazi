import moment from 'moment';

export default {
  currentUTC() {
    return moment.utc().toDate().getTime();
  },

  stringDateToUTCTimestamp(date) {
    return new Date(`${date} UTC`).getTime() / 1000;
  }
};
