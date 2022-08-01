import { ValidationError } from 'ajv';
import createError from 'api/utils/Error';

describe('Error', () => {
  it('should return an UwaziError with message and code', () => {
    const error = createError('error message', 500);
    expect(error.message).toBe('error message');
    expect(error.code).toBe(500);
  });

  describe('when passing an instance of Error', () => {
    it('should return an UwaziError with message, code and the original instance', () => {
      const instance = new Error('error message');
      const error = createError(instance, 500);
      expect(error.message).toBe('error message');
      expect(error.code).toBe(500);
      expect(error.original).toBe(instance);
    });
  });

  describe('when passing an AJVError', () => {
    it('should return an UwaziError with message and code', () => {
      const validationErrors = [
        {
          keyword: 'type',
          instancePath: '.body.prop1',
          schemaPath: '#/properties/body/properties/prop1/type',
          params: [],
          message: 'should be string',
        },
        {
          keyword: 'type',
          instancePath: '.body.prop2',
          schemaPath: '#/properties/body/properties/prop2/type',
          params: [],
          message: 'should be number',
        },
      ];

      const error = createError(new ValidationError(validationErrors), 350);
      expect(error.message).toBe('validation failed');
      expect(error.errors).toEqual(validationErrors);
      expect(error.code).toBe(350);
    });
  });
});
