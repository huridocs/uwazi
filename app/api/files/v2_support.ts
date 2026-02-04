import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultRelationshipDataSource } from '#api/relationships.v2/database/data_source_defaults.js';
import { DenormalizationService } from '#api/relationships.v2/services/service_factories.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

export const V2 = {
  async deleteTextReferencesToFiles(_ids: string[]) {
    const transactionManager = TransactionManagerFactory.default();

    if (
      !(await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed())
    ) {
      return;
    }

    const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);
    const denormalizationService = await DenormalizationService(transactionManager);

    await denormalizationService.denormalizeBeforeDeletingFiles(_ids);
    await relationshipsDataSource.deleteByReferencedFiles(_ids);
    await transactionManager.executeOnCommitHandlers(undefined);
  },
};
