import { HttpField } from '../HttpField';

describe('HttpField', () => {
  it('should parse a string value correctly', () => {
    const field = new HttpField('test');
    expect(field.value).toBe('test');
  });

  it('should parse a number value correctly', () => {
    const field = new HttpField(123);
    expect(field.value).toBe('123');
  });

  it('should parse a boolean value correctly', () => {
    const field = new HttpField(true);
    expect(field.value).toBe('true');
  });

  it('should parse an array value correctly', () => {
    const field = new HttpField([1, 2, 3]);
    expect(field.value).toBe('[1,2,3]');
  });

  it('should parse an object value correctly', () => {
    const field = new HttpField({ key: 'value' });
    expect(field.value).toBe('{"key":"value"}');
  });

  it('should parse a null value correctly', () => {
    const field = new HttpField(null);
    expect(field.value).toBe('null');
  });

  it('should parse an undefined value correctly', () => {
    const field = new HttpField(undefined);
    expect(field.value).toBe('undefined');
  });
});
