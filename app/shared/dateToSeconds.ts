import parser from 'any-date-parser';

const dateToSeconds = (value: string) => {
  // Remove accents
  const parsedValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let getDate = parser.fromString(parsedValue);
  if (getDate.invalid) {
    getDate = Date.parse(`${parsedValue} GMT`);
  }
  const formattedDate = getDate / 1000;
  return formattedDate;
};

export { dateToSeconds };
