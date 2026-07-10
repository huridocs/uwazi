import { Tenant } from '#api/tenants/tenantContext.js';
import { StandardLogger } from '../../StandardLogger.js';
import { MigrationHumanReadableWriter } from '../MigrationHumanReadableWriter.js';

const tenant: Tenant = {
  name: 'testTenant',
  dbName: 'testTenant',
  indexName: 'testTenant',
  uploadedDocuments: 'testTenant/folder',
  attachments: 'testTenant/attachments',
  customUploads: 'testTenant/customUploads',
  activityLogs: 'testTenant/activityLogs',
  domain: 'test-tenant',
};

const logger = new StandardLogger(MigrationHumanReadableWriter, tenant);
const mockedTimeStamp = Date.UTC(1999, 11, 31, 23, 59);

const color = (code: string) => `\u001b[${code}m`;
const reset = '\u001b[0m';

describe('MigrationHumanReadableWriter', () => {
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

  it('should not include timestamp', () => {
    logger.info('migration message');
    expect(stdoutMock).toHaveBeenCalledWith(`${color('32')}[INFO]${reset} migration message\n`);
  });

  it.each([
    { level: 'debug', code: '36' },
    { level: 'info', code: '32' },
    { level: 'warning', code: '33' },
    { level: 'error', code: '31' },
    { level: 'critical', code: '31' },
  ] as const)('should color $level output', ({ level, code }) => {
    // @ts-ignore
    logger[level](`${level} message`);
    expect(stdoutMock).toHaveBeenCalledWith(
      `${color(code)}[${level.toUpperCase()}]${reset} ${level} message\n`
    );
  });

  it('should omit namespace from metadata', () => {
    logger.info('migration message', { namespace: 'system', delta: 5 });
    expect(stdoutMock).toHaveBeenCalledWith(
      `${color('32')}[INFO]${reset} migration message (delta=5)\n`
    );
  });

  it('should format array metadata', () => {
    logger.info('applied schemas', { applied: [1, 2, 3] });
    expect(stdoutMock).toHaveBeenCalledWith(
      `${color('32')}[INFO]${reset} applied schemas (applied=[1, 2, 3])\n`
    );
  });

  it('should skip empty metadata', () => {
    logger.info('no metadata', {});
    expect(stdoutMock).toHaveBeenCalledWith(`${color('32')}[INFO]${reset} no metadata\n`);
  });

  it('should skip metadata with only undefined values', () => {
    logger.info('empty metadata', { a: undefined });
    expect(stdoutMock).toHaveBeenCalledWith(`${color('32')}[INFO]${reset} empty metadata\n`);
  });
});
