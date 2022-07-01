import moment from 'moment';

const isSameDate = (first: number, second: number) =>
  moment.unix(first).utc().isSame(moment.unix(second).utc(), 'day');

export { isSameDate };
