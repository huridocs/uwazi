import { wrapValidation } from '../wrapValidation';

describe('wrapValidation', () => {
  describe('when called with a validator and model', () => {
    it('should return a model that validates input to each method defined in the validator', () => {
      const foo = jest.fn();
      const bar = jest.fn();
      const baz = jest.fn();
      const model = {
        foo(...args) { foo(...args); },
        bar(...args) { bar(...args); },
        baz(...args) { baz(...args); }
      };
      const validator = {
        foo() { throw new Error('error'); },
        bar() {}
      };

      const validated = wrapValidation(validator, model);
      try {
        validated.foo('arg');
      } catch (e) {
        expect(e.message).toBe('error');
        expect(foo).not.toHaveBeenCalled();
      }

      validated.bar('arg1', 2);
      expect(bar).toHaveBeenCalledWith('arg1', 2);

      validated.baz('arg');
      expect(baz).toHaveBeenCalledWith('arg');
    });
  });
});
