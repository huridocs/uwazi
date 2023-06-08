import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { DenormalizationService } from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

export const V2 = {
  async deleteTextReferencesToFiles(_ids: string[]) {
    const transactionManager = new MongoTransactionManager(getClient());

    if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
      return;
    }

    const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);
    const denormalizationService = await DenormalizationService(transactionManager);

    await denormalizationService.denormalizeBeforeDeletingFiles(_ids);
    await relationshipsDataSource.deleteByReferencedFiles(_ids);
    await transactionManager.executeOnCommitHandlers(undefined);
  },
};
