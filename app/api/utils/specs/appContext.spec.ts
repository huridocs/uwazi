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
});
