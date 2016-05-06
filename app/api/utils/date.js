import moment from 'moment';

export default {
  currentUTC() {
    return moment.utc().toDate().getTime();
  }
};
