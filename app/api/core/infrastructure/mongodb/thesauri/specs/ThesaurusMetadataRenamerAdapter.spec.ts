jest.mock('#api/entities/denormalize.js', () => ({
  denormalizeThesauriLabelInMetadata: jest.fn(),
}));

import { testingTenants } from '#api/utils/testingTenants.js';
import { thesaurusMetadataRenamerAdapter } from '../ThesaurusMetadataRenamerAdapter.js';
import { denormalizeThesauriLabelInMetadata } from '#api/entities/denormalize.js';

const mockedDenormalize = denormalizeThesauriLabelInMetadata as jest.Mock;

describe('ThesaurusMetadataRenamerAdapter', () => {
  beforeEach(() => {
    testingTenants.mockCurrentTenant({ name: 'tenant', dbName: 'db', indexName: 'index' });
    mockedDenormalize.mockClear();
  });

  it('should be a no-op when postgresEntities is active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresEntities: true } });

    await thesaurusMetadataRenamerAdapter.renameInMetadata('valueId', 'New label', 'th1', 'en');

    expect(mockedDenormalize).not.toHaveBeenCalled();
  });

  it('should denormalize labels when postgresEntities is not active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: {} });

    await thesaurusMetadataRenamerAdapter.renameInMetadata('valueId', 'New label', 'th1', 'en');

    expect(mockedDenormalize).toHaveBeenCalledWith('valueId', 'New label', 'th1', 'en');
  });
});
