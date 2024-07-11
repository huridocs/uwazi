import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { createDebugLog } from '../debugLog';

let lastLogMessage = '';

const testLogger = log => {
  lastLogMessage = log;
};

describe('errorLog', () => {
  beforeEach(() => {
    config.JSON_LOGS = false;
  });

  it('should log errors to stdout with tenant name and message', async () => {
    const aDebugLog = createDebugLog(testLogger);

    tenants.add({ name: 'tenant' });

    await tenants.run(async () => {
      aDebugLog.debug('a message');
    }, 'tenant');

    expect(lastLogMessage).toContain('[tenant] a message');
  });

  it('should log errors to stdout as JSON when config.JSON_LOGS is true', async () => {
    config.JSON_LOGS = true;
    const aDebugLog = createDebugLog(testLogger);

    tenants.add({ name: 'tenant' });

    await tenants.run(async () => {
      aDebugLog.debug('a message');
    }, 'tenant');

    expect(JSON.parse(lastLogMessage)).toMatchObject({
      message: expect.stringMatching('a message'),
      tenant: 'tenant',
      level: 'debug',
    });
  });

  describe('when current tenant fails', () => {
    it('should log errors to stdout with default tenant name, message and tenant error', () => {
      const aDebugLog = createDebugLog(testLogger);

      aDebugLog.debug('a message');

      expect(lastLogMessage).toContain('[localhost] a message');
      expect(lastLogMessage).toContain('[Tenant error]');
    });
  });

  it('should overwritte instance name from env vars', async () => {
    process.env.DATABASE_NAME = 'my_instance';

    const aDebugLog = createDebugLog(testLogger);

    await tenants.run(async () => {
      aDebugLog.debug('a message');
    });

    expect(lastLogMessage).toContain('a message');
    expect(lastLogMessage).toContain('[my_instance]');
  });
});
