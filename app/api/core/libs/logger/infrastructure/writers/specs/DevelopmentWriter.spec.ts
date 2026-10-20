import { Tenant } from '#api/tenants/tenantContext.js';
import { StandardLogger } from '../../StandardLogger.js';
import { DevelopmentWritter } from '../DevelopmentWriter.js';

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

describe('DevelopmentWriter', () => {
  let stdout: jest.SpyInstance;

  beforeEach(() => {
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdout.mockRestore();
  });

  it('should include the correlation_id when one is set', () => {
    new StandardLogger(DevelopmentWritter, tenant, 'corr-123').info('hello');

    expect(stdout).toHaveBeenCalledWith(`[info] - [testTenant] - [corr-123]:'hello'\n`);
  });

  it('should not render a correlation_id when none is set', () => {
    new StandardLogger(DevelopmentWritter, tenant).info('hello');

    expect(stdout).toHaveBeenCalledWith(`[info] - [testTenant]:'hello'\n`);
  });
});
