import moment, { Moment } from 'moment-timezone';

export const removeOffset = (
  useTimezone: boolean,
  value: string | number | null | undefined
): Moment | null => {
  if (!value) return null;
  const milliseconds = typeof value === 'number' ? value * 1000 : moment(value).valueOf();
  const newValue = moment.utc(milliseconds);
  if (!useTimezone) {
    newValue.subtract(moment(milliseconds).utcOffset(), 'minutes');
  }
  return newValue;
};

export const addOffset = (
  useTimezone: boolean,
  endOfDay: boolean,
  value: string,
  dateFormat: string
): Moment | null => {
  let parsedDate = moment(value, dateFormat, true);
  if (!parsedDate.isValid()) {
    parsedDate = moment(value);
  }
  if (!parsedDate.isValid()) {
    return null;
  }
  const newValue = moment.utc(parsedDate);
  if (!useTimezone) {
    newValue.add(moment(value).utcOffset(), 'minutes');
  }
  if (endOfDay) {
    const dateValue = useTimezone ? newValue.local() : newValue.utc();
    dateValue.endOf('day');
    return dateValue;
  }
  return newValue;
}; 