/* eslint-disable max-len */
import { Tenant } from 'api/tenants/tenantContext';
import { StandardLogger, withFeature } from '../StandardLogger';
import { StandardJSONWriter } from '../writers/StandardJSONWriter';
import { StandardWriter } from '../writers/StandardWriter';

const tenant: Tenant = {
  name: 'testTenant',
  dbName: 'testTenant',
  indexName: 'testTenant',
  uploadedDocuments: 'testTenant/folder',
  attachments: 'testTenant/attachments',
  customUploads: 'testTenant/customUploads',
  activityLogs: 'testTenant/activityLogs',
};

const jsonLogger = new StandardLogger(StandardJSONWriter, tenant);
const standardLogger = new StandardLogger(StandardWriter, tenant);
const mockedTimeStamp = Date.UTC(1999, 11, 31, 23, 59);
const mockedDateString = '1999-12-31T23:59:00.000Z';

describe('Logger', () => {
  let stdoutMock: jest.SpyInstance;

  let dateMock: jest.SpyInstance;

  beforeAll(() => {
    stdoutMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    dateMock = jest.spyOn(Date, 'now').mockReturnValue(mockedTimeStamp);
  });

  beforeEach(() => {
    stdoutMock.mockClear();
  });

  afterAll(() => {
    stdoutMock.mockRestore();
    dateMock.mockRestore();
  });

  describe('StandardWriter', () => {
    it.each([
      {
        logger: standardLogger,
        level: 'debug',
        message: 'debug message',
        expected: `${mockedDateString} - [debug] - [testTenant]:debug message\n`,
      },
      {
        logger: standardLogger,
        level: 'info',
        message: 'info message',
        expected: `${mockedDateString} - [info] - [testTenant]:info message\n`,
      },
      {
        logger: standardLogger,
        level: 'warning',
        message: 'warning message',
        expected: `${mockedDateString} - [warning] - [testTenant]:warning message\n`,
      },
      {
        logger: standardLogger,
        level: 'error',
        message: 'error message',
        expected: `${mockedDateString} - [error] - [testTenant]:error message\n`,
      },
      {
        logger: standardLogger,
        level: 'critical',
        message: 'critical message',
        expected: `${mockedDateString} - [critical] - [testTenant]:critical message\n`,
      },
    ])('should log $level', ({ logger, level, message, expected }) => {
      // @ts-ignore
      logger[level](message);
      expect(stdoutMock).toHaveBeenCalledWith(expected);
    });

    it.each([
      {
        logger: standardLogger,
        level: 'debug',
        message: 'debug message',
        metadata: { extra: 'info' },
        expected: `${mockedDateString} - [debug] - [testTenant]:debug message\n{"extra":"info"}`,
      },
      {
        logger: standardLogger,
        level: 'info',
        message: 'info message',
        metadata: { extra: 'info' },
        expected: `${mockedDateString} - [info] - [testTenant]:info message\n{"extra":"info"}`,
      },
      {
        logger: standardLogger,
        level: 'warning',
        message: 'warning message',
        metadata: { extra: 'info' },
        expected: `${mockedDateString} - [warning] - [testTenant]:warning message\n{"extra":"info"}`,
      },
      {
        logger: standardLogger,
        level: 'error',
        message: 'error message',
        metadata: { extra: 'info' },
        expected: `${mockedDateString} - [error] - [testTenant]:error message\n{"extra":"info"}`,
      },
      {
        logger: standardLogger,
        level: 'critical',
        message: 'critical message',
        metadata: { extra: 'info' },
        expected: `${mockedDateString} - [critical] - [testTenant]:critical message\n{"extra":"info"}`,
      },
    ] as const)(
      'should accept extra params as an optional map on $level',
      ({ logger, level, message, expected, metadata }) => {
        logger[level](message, metadata);
        expect(stdoutMock).toHaveBeenCalledWith(expected);
      }
    );
  });

  describe('JSONWriter', () => {
    it.each([
      {
        logger: jsonLogger,
        level: 'debug',
        message: 'debug message',
        expected: {
          timestamp: mockedDateString,
          level: 'debug',
          tenant: 'testTenant',
          message: 'debug message',
        },
      },
      {
        logger: jsonLogger,
        level: 'info',
        message: 'info message',
        expected: {
          timestamp: mockedDateString,
          level: 'info',
          tenant: 'testTenant',
          message: 'info message',
        },
      },
      {
        logger: jsonLogger,
        level: 'warning',
        message: 'warning message',
        expected: {
          timestamp: mockedDateString,
          level: 'warning',
          tenant: 'testTenant',
          message: 'warning message',
        },
      },
      {
        logger: jsonLogger,
        level: 'error',
        message: 'error message',
        expected: {
          timestamp: mockedDateString,
          level: 'error',
          tenant: 'testTenant',
          message: 'error message',
        },
      },
      {
        logger: jsonLogger,
        level: 'critical',
        message: 'critical message',
        expected: {
          timestamp: mockedDateString,
          level: 'critical',
          tenant: 'testTenant',
          message: 'critical message',
        },
      },
    ] as const)('should log $level', ({ logger, level, message, expected }) => {
      logger[level](message);
      const logged = stdoutMock.mock.calls[0][0];
      expect(JSON.parse(logged)).toMatchObject(expected);
    });

    it.each([
      {
        logger: jsonLogger,
        level: 'debug',
        message: 'debug message',
        metadata: { extra: 'info' },
        expected: {
          timestamp: mockedDateString,
          level: 'debug',
          tenant: 'testTenant',
          message: 'debug message',
          extra: 'info',
        },
      },
      {
        logger: jsonLogger,
        level: 'info',
        message: 'info message',
        metadata: { extra: 'info' },
        expected: {
          timestamp: mockedDateString,
          level: 'info',
          tenant: 'testTenant',
          message: 'info message',
          extra: 'info',
        },
      },
      {
        logger: jsonLogger,
        level: 'warning',
        message: 'warning message',
        metadata: { extra: 'info' },
        expected: {
          timestamp: mockedDateString,
          level: 'warning',
          tenant: 'testTenant',
          message: 'warning message',
          extra: 'info',
        },
      },
      {
        logger: jsonLogger,
        level: 'error',
        message: 'error message',
        metadata: { extra: 'info' },
        expected: {
          timestamp: mockedDateString,
          level: 'error',
          tenant: 'testTenant',
          message: 'error message',
          extra: 'info',
        },
      },
      {
        logger: jsonLogger,
        level: 'critical',
        message: 'critical message',
        metadata: { extra: 'info' },
        expected: {
          timestamp: mockedDateString,
          level: 'critical',
          tenant: 'testTenant',
          message: 'critical message',
          extra: 'info',
        },
      },
    ] as const)(
      'should accept extra params as an optional map on $level',
      ({ logger, level, message, expected, metadata }) => {
        logger[level](message, metadata);
        const logged = stdoutMock.mock.calls[0][0];
        expect(JSON.parse(logged)).toMatchObject(expected);
      }
    );
  });

  describe('withFeature decorator', () => {
    it.each([
      {
        feature: 'feature_name',
        level: 'info',
        expected: { message: 'info with feature', level: 'info', feature: 'feature_name' },
      },
      {
        feature: 'feature_name',
        level: 'debug',
        expected: { message: 'debug with feature', level: 'debug', feature: 'feature_name' },
      },
      {
        feature: 'feature_name',
        level: 'error',
        expected: { message: 'error with feature', level: 'error', feature: 'feature_name' },
      },
      {
        feature: 'feature_name',
        level: 'warning',
        expected: { message: 'warning with feature', level: 'warning', feature: 'feature_name' },
      },
      {
        feature: 'feature_name',
        level: 'critical',
        expected: { message: 'critical with feature', level: 'critical', feature: 'feature_name' },
      },
    ] as const)(
      'should decorate log with extra "feature" property on $level',
      async ({ level, expected, feature }) => {
        const featureLogger = new StandardLogger(withFeature(StandardJSONWriter, feature), tenant);

        featureLogger[level](`${level} with feature`);

        const logged = stdoutMock.mock.calls[0][0];
        expect(JSON.parse(logged)).toMatchObject(expected);
      }
    );
  });

  it('should be able to log multiple lines together', () => {
    const message = ['multiple', 'line', 'message'];
    standardLogger.debug(message);
    const expected = `${mockedDateString} - [debug] - [testTenant]:multiple\nline\nmessage\n`;
    expect(stdoutMock).toHaveBeenCalledWith(expected);
  });
});
