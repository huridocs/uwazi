import { appContext } from '../AppContext';

describe('appContext', () => {
  describe('when running the callback inside a context', () => {
    it('it should access the given values', async () => {
      await appContext.run(
        async () => {
          expect(appContext.get('key1')).toBe('value1');
          expect(appContext.get('key2')).toBe('value2');
        },
        {
          key1: 'value1',
          key2: 'value2',
        }
      );
    });

    it('it should return undefined if accessing an unexising key', async () => {
      await appContext.run(
        async () => {
          expect(appContext.get('non-existing')).toBe(undefined);
        },
        {
          key: 'value',
        }
      );
    });

    it('it should set a new key', async () => {
      await appContext.run(async () => {
        expect(appContext.get('someKey')).toBe(undefined);
        appContext.set('someKey', 'someValue');
        expect(appContext.get('someKey')).toBe('someValue');
      });
    });

    it('it should overwrite existing keys', async () => {
      await appContext.run(
        async () => {
          expect(appContext.get('someKey')).toBe('previous');
          appContext.set('someKey', 'someValue');
          expect(appContext.get('someKey')).toBe('someValue');
        },
        {
          someKey: 'previous',
        }
      );
    });
  });

  describe('when outside a context', () => {
    const error = new Error('Accessing nonexistent async context');

    it('should throw on get', () => {
      expect(() => {
        appContext.get('somKey');
      }).toThrow(error);
    });

    it('should throw on set', () => {
      expect(() => {
        appContext.set('somKey', 'someValue');
      }).toThrow(error);
    });
  });
});
