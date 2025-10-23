import { isSameDay, fromUnixTime } from 'date-fns';

const isSameDate = (first: number, second: number) =>
  isSameDay(fromUnixTime(first), fromUnixTime(second));

export { isSameDate };
