import { stringToTypeOfProperty } from 'shared/stringToTypeOfProperty';

it('should convert a string to a date timestamp', () => {
  expect(stringToTypeOfProperty('January 1, 1999', 'date')).toBe(915148800);
});

it('should convert a string to a number timestamp', () => {
  expect(stringToTypeOfProperty('1234', 'numeric')).toBe(1234);
});

it('should keep the string if not date or numeric', () => {
  expect(stringToTypeOfProperty('some string', 'select')).toBe('some string');
});

it('should keep null if the input is null', () => {
  expect(stringToTypeOfProperty(null, 'date')).toBe(null);
});
