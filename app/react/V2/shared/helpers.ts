import moment from 'moment-timezone';

const propertyValueFormatter = {
  date: (timestamp: string) => moment.utc(timestamp, 'X').format('ll'),
};

export { propertyValueFormatter };
