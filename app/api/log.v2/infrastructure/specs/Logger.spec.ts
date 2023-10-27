import { Tenant } from 'api/tenants/tenantContext';
import { StandardLogger } from '../StandardLogger';
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

  it.each([
    {
      logger: standardLogger,
      level: 'debug',
      message: 'debug message',
      expected: `${mockedDateString} - [DEBUG] - [testTenant]:debug message\n`,
    },
    {
      logger: jsonLogger,
      level: 'debug',
      message: 'debug message',
      expected: `{"time":"${mockedDateString}","level":"DEBUG","tenant":"testTenant","message":"debug message"}\n`,
    },
    {
      logger: standardLogger,
      level: 'info',
      message: 'info message',
      expected: `${mockedDateString} - [INFO] - [testTenant]:info message\n`,
    },
    {
      logger: jsonLogger,
      level: 'info',
      message: 'info message',
      expected: `{"time":"${mockedDateString}","level":"INFO","tenant":"testTenant","message":"info message"}\n`,
    },
    {
      logger: standardLogger,
      level: 'warning',
      message: 'warning message',
      expected: `${mockedDateString} - [WARNING] - [testTenant]:warning message\n`,
    },
    {
      logger: jsonLogger,
      level: 'warning',
      message: 'warning message',
      expected: `{"time":"${mockedDateString}","level":"WARNING","tenant":"testTenant","message":"warning message"}\n`,
    },
    {
      logger: standardLogger,
      level: 'error',
      message: 'error message',
      expected: `${mockedDateString} - [ERROR] - [testTenant]:error message\n`,
    },
    {
      logger: jsonLogger,
      level: 'error',
      message: 'error message',
      expected: `{"time":"${mockedDateString}","level":"ERROR","tenant":"testTenant","message":"error message"}\n`,
    },
    {
      logger: standardLogger,
      level: 'critical',
      message: 'critical message',
      expected: `${mockedDateString} - [CRITICAL] - [testTenant]:critical message\n`,
    },
    {
      logger: jsonLogger,
      level: 'critical',
      message: 'critical message',
      expected: `{"time":"${mockedDateString}","level":"CRITICAL","tenant":"testTenant","message":"critical message"}\n`,
    },
  ])('should log $level', ({ logger, level, message, expected }) => {
    // @ts-ignore
    logger[level](message);
    expect(stdoutMock).toHaveBeenCalledWith(expected);
  });

  it('should be able to log multiple lines together', () => {
    const message = ['multiple', 'line', 'message'];
    standardLogger.debug(message);
    const expected = `${mockedDateString} - [DEBUG] - [testTenant]:multiple\nline\nmessage\n`;
    expect(stdoutMock).toHaveBeenCalledWith(expected);
  });
});
