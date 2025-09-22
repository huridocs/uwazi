import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { DefaultRelationshipDataSource } from '../relationships.v2/database/data_source_defaults.js';
import { DenormalizationService } from '../relationships.v2/services/service_factories.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';

export const V2 = {
  async deleteTextReferencesToFiles(_ids: string[]) {
    const transactionManager = DefaultTransactionManager();

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
