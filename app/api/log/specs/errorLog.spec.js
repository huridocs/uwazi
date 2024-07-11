import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { createErrorLog } from '../logger';

let lastLogMessage = '';

const testLogger = log => {
  lastLogMessage = log;
};

describe('errorLog', () => {
  beforeEach(() => {
    config.JSON_LOGS = false;
  });

  it('should log errors to stdout with tenant name and message', async () => {
    const anErrorLog = createErrorLog(testLogger);

    tenants.add({ name: 'tenant' });

    await tenants.run(async () => {
      anErrorLog.error('a message');
    }, 'tenant');

    expect(lastLogMessage).toContain('[tenant] a message');
  });

  it('should log errors to stdout as JSON when config.JSON_LOGS is true', async () => {
    config.JSON_LOGS = true;
    const anErrorLog = createErrorLog(testLogger);

    tenants.add({ name: 'tenant' });

    await tenants.run(async () => {
      anErrorLog.error('a message');
    }, 'tenant');

    expect(JSON.parse(lastLogMessage)).toMatchObject({
      message: expect.stringMatching('a message'),
      tenant: 'tenant',
      level: 'error',
    });
  });

  describe('when current tenant fails', () => {
    it('should log errors to stdout with default tenant name, message and tenant error', () => {
      const anErrorLog = createErrorLog(testLogger);

      anErrorLog.error('a message');

      expect(lastLogMessage).toContain('[localhost] a message');
      expect(lastLogMessage).toContain('[Tenant error]');
    });
  });

  it('should overwritte instance name from env vars', async () => {
    process.env.DATABASE_NAME = 'my_instance';

    const anErrorLog = createErrorLog(testLogger);

    await tenants.run(async () => {
      anErrorLog.error('a message');
    });

    expect(lastLogMessage).toContain('a message');
    expect(lastLogMessage).toContain('[my_instance]');
  });
});
