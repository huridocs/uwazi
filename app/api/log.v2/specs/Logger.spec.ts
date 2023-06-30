import { Tenant } from 'api/tenants/tenantContext';
import { Logger } from '../Logger';

const tenant: Tenant = {
  name: 'testTenant',
  dbName: 'testTenant',
  indexName: 'testTenant',
  uploadedDocuments: 'testTenant/folder',
  attachments: 'testTenant/attachments',
  customUploads: 'testTenant/customUploads',
  activityLogs: 'testTenant/activityLogs',
};

const logging = new Logger(tenant);
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
      level: 'debug',
      message: 'debug message',
      asJSON: false,
      expected: `${mockedDateString} - [DEBUG] - [testTenant]:debug message\n`,
    },
    {
      level: 'debug',
      message: 'debug message',
      asJSON: true,
      expected: `{"time":"${mockedDateString}","level":"DEBUG","tenant":"testTenant","message":"debug message"}\n`,
    },
    {
      level: 'info',
      message: 'info message',
      asJSON: false,
      expected: `${mockedDateString} - [INFO] - [testTenant]:info message\n`,
    },
    {
      level: 'info',
      message: 'info message',
      asJSON: true,
      expected: `{"time":"${mockedDateString}","level":"INFO","tenant":"testTenant","message":"info message"}\n`,
    },
    {
      level: 'warning',
      message: 'warning message',
      asJSON: false,
      expected: `${mockedDateString} - [WARNING] - [testTenant]:warning message\n`,
    },
    {
      level: 'warning',
      message: 'warning message',
      asJSON: true,
      expected: `{"time":"${mockedDateString}","level":"WARNING","tenant":"testTenant","message":"warning message"}\n`,
    },
    {
      level: 'error',
      message: 'error message',
      asJSON: false,
      expected: `${mockedDateString} - [ERROR] - [testTenant]:error message\n`,
    },
    {
      level: 'error',
      message: 'error message',
      asJSON: true,
      expected: `{"time":"${mockedDateString}","level":"ERROR","tenant":"testTenant","message":"error message"}\n`,
    },
    {
      level: 'critical',
      message: 'critical message',
      asJSON: false,
      expected: `${mockedDateString} - [CRITICAL] - [testTenant]:critical message\n`,
    },
    {
      level: 'critical',
      message: 'critical message',
      asJSON: true,
      expected: `{"time":"${mockedDateString}","level":"CRITICAL","tenant":"testTenant","message":"critical message"}\n`,
    },
  ])('should log $level', ({ level, message, asJSON, expected }) => {
    // @ts-ignore
    logging[level](message, asJSON);
    expect(stdoutMock).toHaveBeenCalledWith(expected);
  });

  it('should be able to log multiple lines together', () => {
    const message = ['multiple', 'line', 'message'];
    const expected = `${mockedDateString} - [DEBUG] - [testTenant]:multiple\nline\nmessage\n`;
    logging.debug(message);
    expect(stdoutMock).toHaveBeenCalledWith(expected);
  });
});
