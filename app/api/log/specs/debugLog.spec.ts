import winston from 'winston';
import * as Transport from 'winston-transport';

import { tenants } from 'api/tenants';
import { createDebugLog } from '../debugLog';

interface ExtendedTransports extends Transport {
  dirname?: String;
  filename?: String;
}

interface ExtendedLogger extends winston.Logger {
  transports: ExtendedTransports[];
}

describe('Debug Log', () => {
  let debugLog: ExtendedLogger;
  let logSpy: jasmine.Spy;

  const instatiateLog = () => {
    debugLog = createDebugLog();
    logSpy = jasmine.createSpy('log');
    debugLog.transports[0].log = logSpy;
  };

  const getLogResult = () => {
    const callArgs = logSpy.calls.mostRecent().args[0];
    return callArgs[Symbol.for('message')];
  };

  const expectCorrectLog = (result: String, dirname: String, filename: String) => {
    expect(getLogResult()).toContain(result);
    expect(debugLog.transports[0].dirname).toBe(dirname);
    expect(debugLog.transports[0].filename).toBe(filename);
  };

  it('should log the error with timestamp in the default dir for default database', () => {
    instatiateLog();
    debugLog.debug('a debug message');

    expect(debugLog.transports[0].level).toBe('debug');
    expect(getLogResult()).toEqual(expect.stringMatching(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/));
    expectCorrectLog('[localhost] a debug message', './log', 'debug.log');
    expectCorrectLog(
      '[Tenant error] Error: Accessing nonexistent async context',
      './log',
      'debug.log'
    );
  });

  it('should respect env vars for tenant (database name) and dir', async () => {
    process.env.LOGS_DIR = './some_dir';
    instatiateLog();

    tenants.add({
      name: 'tenant',
      dbName: 'tenantDB',
      indexName: 'tenantIndex',
      uploadedDocuments: '',
      attachments: '',
      customUploads: '',
      temporalFiles: '',
      activityLogs: '',
    });

    await tenants.run(async () => {
      debugLog.debug('a tenant debug message');
    }, 'tenant');

    expectCorrectLog('[tenant] a tenant debug message', './some_dir', 'debug.log');
  });
});
