/** @format */

import { wrapValidation } from '../wrapValidation';

describe('wrapValidation', () => {
  let model;
  let validator;

  beforeEach(() => {
    model = {
      foo: jest.fn(),
      bar: jest.fn().mockReturnValue(10),
      baz: jest.fn().mockReturnValue(20),
    };
    validator = {
      foo() {
        throw new Error('error');
      },
      bar() {},
    };
  });

  describe('when called with a validator and model', () => {
    it('should return a model that validates input to each method defined in the validator', () => {
      const validated = wrapValidation(validator, model);

      try {
        validated.foo('arg');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('error');
        expect(model.foo).not.toHaveBeenCalled();
      }

      let res = validated.bar('arg1', 2);
      expect(model.bar).toHaveBeenCalledWith('arg1', 2);
      expect(res).toBe(10);

      res = validated.baz('arg');
      expect(model.baz).toHaveBeenCalledWith('arg');
      expect(res).toBe(20);
    });

    it('should support async validator functions', async () => {
      validator = {
        foo() {
          return Promise.reject(new Error('error'));
        },
        bar() {
          return Promise.resolve();
        },
      };
      const validated = wrapValidation(validator, model);

      try {
        await validated.foo('arg');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('error');
        expect(model.foo).not.toBeCalled();
      }

      let res = await validated.bar('arg1', 2);
      expect(model.bar).toHaveBeenCalledWith('arg1', 2);
      expect(res).toBe(10);

      res = await validated.baz('arg');
      expect(model.baz).toHaveBeenCalledWith('arg');
      expect(res).toBe(20);
    });

    it('should support models that use `this` keyword or mutate their own data', () => {
      validator.foo = () => {};
      model = {
        val: 5,
        foo: jest.fn().mockReturnValue(10),
        bar(arg) {
          this.val += 1;
          return this.val + this.foo(arg);
        },
        baz(arg) {
          return 2 * this.bar(arg);
        },
      };
      const validated = wrapValidation(validator, model);

      let res = validated.bar('arg1');
      expect(model.foo).toHaveBeenCalledWith('arg1');
      expect(res).toBe(16);

      res = validated.baz('arg2');
      expect(model.foo).toHaveBeenCalledWith('arg2');
      expect(res).toBe(34);
    });
  });
});
