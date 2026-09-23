import { CliConfig } from '../CliConfig.js';
import { ConfigMissing } from '../ConfigMissing.js';

describe('CliConfig', () => {
  describe('assertRequired()', () => {
    it('should pass when every required variable is set', () => {
      expect(() =>
        CliConfig.assertRequired(['MONGO_URI', 'POSTGRES_HOST'], {
          MONGO_URI: 'mongodb://db',
          POSTGRES_HOST: 'pg',
        })
      ).not.toThrow();
    });

    it('should report every missing or empty variable at once', () => {
      const run = () =>
        CliConfig.assertRequired(['MONGO_URI', 'POSTGRES_HOST', 'POSTGRES_DB'], {
          MONGO_URI: 'mongodb://db',
          POSTGRES_HOST: '',
        });

      expect(run).toThrow(ConfigMissing);
      expect(run).toThrow(
        expect.objectContaining({
          code: 'config.missing',
          missing: ['POSTGRES_HOST', 'POSTGRES_DB'],
        })
      );
    });
  });
});
