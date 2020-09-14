import { tenants } from 'api/tenants';
import { createErrorLog } from '../errorLog';

describe('errorLog', () => {
  it('should have a file and a console transports', () => {
    const anErrorLog = createErrorLog();

    expect(anErrorLog.transports[0].constructor.name).toBe('File');
    expect(anErrorLog.transports[1].constructor.name).toBe('Console');
    expect(anErrorLog.transports.length).toBe(2);
  });

  it('should call 2 transports with tenant name and message', async () => {
    const anErrorLog = createErrorLog();

    spyOn(anErrorLog.transports[0], 'log');
    spyOn(anErrorLog.transports[1], 'log');

    tenants.add({ name: 'tenant' });

    await tenants.run(async () => {
      anErrorLog.error('a message');
    }, 'tenant');

    let fileArgs = anErrorLog.transports[0].log.calls.mostRecent().args[0];
    fileArgs = Object.getOwnPropertySymbols(fileArgs).map(s => fileArgs[s]);

    expect(fileArgs[1]).toContain('a message');
    expect(fileArgs[1]).toContain('[tenant]');

    let consoleArgs = anErrorLog.transports[1].log.calls.mostRecent().args[0];
    consoleArgs = Object.getOwnPropertySymbols(consoleArgs).map(s => consoleArgs[s]);

    expect(consoleArgs[1]).toContain('a message');
    expect(consoleArgs[1]).toContain('[tenant]');
  });

  it('should overwritte logs path from env vars', async () => {
    process.env.LOGS_DIR = './some_dir';

    const anErrorLog = createErrorLog();

    expect(anErrorLog.transports[0].dirname).toBe('./some_dir');
    expect(anErrorLog.transports[0].filename).toBe('error.log');

    await tenants.run(async () => {
      anErrorLog.error('a message');
    });
  });

  it('should overwritte instance name from env vars', async () => {
    process.env.DATABASE_NAME = 'my_instance';

    const anErrorLog = createErrorLog();

    spyOn(anErrorLog.transports[0], 'log');
    spyOn(anErrorLog.transports[1], 'log');

    await tenants.run(async () => {
      anErrorLog.error('a message');
    });

    let calledArgs = anErrorLog.transports[0].log.calls.mostRecent().args[0];
    calledArgs = Object.getOwnPropertySymbols(calledArgs).map(s => calledArgs[s]);

    expect(calledArgs[1]).toContain('a message');
    expect(calledArgs[1]).toContain('[my_instance]');
  });

  it('should add GrayLog transport if defined as env var', () => {
    process.env.USE_GRAYLOG = 'server_address';
    process.env.DATABASE_NAME = 'another instance';

    const anErrorLog = createErrorLog();

    expect(anErrorLog.transports[2].constructor.name).toBe('GrayLogTransport');
    expect(anErrorLog.transports.length).toBe(3);
    expect(anErrorLog.transports[2].graylog.config.servers[0].host).toBe('server_address');
    expect(anErrorLog.transports[2].instanceName).toBe('another instance');
  });
});
