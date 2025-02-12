import { HttpField } from '../HttpField';

describe('HttpField', () => {
  it('should parse a string value correctly', () => {
    const field = new HttpField({ value: 'test' });
    expect(field.value).toBe('test');
  });

  it('should parse a number value correctly', () => {
    const field = new HttpField({ value: 123 });
    expect(field.value).toBe('123');
  });

  it('should parse a boolean value correctly', () => {
    const field = new HttpField({ value: true });
    expect(field.value).toBe('true');
  });

  it('should parse an array value correctly', () => {
    const field = new HttpField({ value: [1, 2, 3] });
    expect(field.value).toBe('[1,2,3]');
  });

  it('should parse an object value correctly', () => {
    const field = new HttpField({ value: { key: 'value' } });
    expect(field.value).toBe('{"key":"value"}');
  });

  it('should parse a null value correctly', () => {
    const field = new HttpField({ value: null });
    expect(field.value).toBe('null');
  });

  it('should parse an undefined value correctly', () => {
    const field = new HttpField({ value: undefined });
    expect(field.value).toBe('undefined');
  });
});
