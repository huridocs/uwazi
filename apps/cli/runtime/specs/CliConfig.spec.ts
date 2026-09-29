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

  describe('requiredFor()', () => {
    const database = [
      'MONGO_URI',
      'POSTGRES_HOST',
      'POSTGRES_PORT',
      'POSTGRES_DB',
      'POSTGRES_APP_USER',
      'POSTGRES_APP_PASSWORD',
    ];

    it('should require nothing outside production, where local defaults apply', () => {
      expect(CliConfig.requiredFor({ redis: true }, { NODE_ENV: 'development' })).toEqual([]);
    });

    it('should require the database variables in production', () => {
      expect(CliConfig.requiredFor({ redis: false }, { NODE_ENV: 'production' })).toEqual(database);
    });

    it('should also require REDIS_HOST in production when the command needs Redis', () => {
      expect(CliConfig.requiredFor({ redis: true }, { NODE_ENV: 'production' })).toEqual([
        ...database,
        'REDIS_HOST',
      ]);
    });
  });
});
