import { Validator } from '../Validator';
import { ValidationError } from '../ValidationError';

describe('Validator', () => {
  const props = {
    schema: Validator.z.object({
      name: Validator.z.string(),
      age: Validator.z.number().int(),
    }),
    code: 'TEST_CODE',
    name: 'TestValidator',
  };

  const validator = new Validator(props);

  it('should validate data successfully', () => {
    const data = { name: 'John Doe', age: 30 };
    expect(() => validator.validate(data)).not.toThrow();
  });

  it('should throw ValidationError for invalid data', () => {
    const data = { name: 'John Doe', age: 'thirty' }; // Invalid age
    expect(() => validator.validate(data)).toThrow(ValidationError);
  });

  it('should throw ValidationError with correct message and code', () => {
    const data = { name: 'John Doe', age: 'thirty' }; // Invalid age
    try {
      validator.validate(data);
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toContain('');
      expect(e.code).toBe(props.code);
      expect(e.name).toBe(props.name);
    }
  });

  it('should rethrow non-ZodError errors', () => {
    const invalidSchema = {
      parse: () => {
        throw new Error('Non-ZodError');
      },
    };

    const invalidValidator = new Validator({ ...props, schema: invalidSchema as any });

    expect(() => invalidValidator.validate({})).toThrow('Non-ZodError');
  });
});
