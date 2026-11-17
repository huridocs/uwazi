const hasBound = (value: number | null | undefined): value is number => typeof value === 'number';

const dateFromTimestamp = (value: number | null | undefined): Date | undefined =>
  hasBound(value) ? new Date(value) : undefined;

export { hasBound, dateFromTimestamp };
