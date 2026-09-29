import { Tenant } from '#api/tenants/tenantContext.js';
import { StandardLogger } from '../../StandardLogger.js';
import { StderrJSONWriter } from '../StderrJSONWriter.js';

const tenant = {
  name: 'testTenant',
  dbName: 'testTenant',
  indexName: 'testTenant',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  domain: 'test-tenant',
} as Tenant;

describe('StderrJSONWriter', () => {
  let stdout: jest.SpyInstance;
  let stderr: jest.SpyInstance;

  beforeEach(() => {
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
  });

  it('should write the standard JSON log line to stderr only', () => {
    new StandardLogger(StderrJSONWriter, tenant, 'correlation-1').info('hello', { extra: 1 });

    expect(stdout).not.toHaveBeenCalled();
    expect(JSON.parse(stderr.mock.calls[0][0])).toMatchObject({
      level: 'info',
      tenant: 'testTenant',
      correlation_id: 'correlation-1',
      message: 'hello',
      extra: 1,
      application_name: 'Uwazi',
    });
  });
});
