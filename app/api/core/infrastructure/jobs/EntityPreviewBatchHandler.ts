import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';

type Params = {
  languageKey: LanguageISO6391;
  sharedIds: string[];
};

type JobDependencies = {
  filesDS: FilesDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  settingsDS: SettingsDataSource;
  transactionManager: MongoTransactionManager;
};

export class EntityPreviewBatchHandler extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo?: JobInfo) {
    const { sharedIds } = params;

    await this.deps.transactionManager.run(async () => {
      const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
      const allThumbnails = await this.deps.filesDS.getThumbnails(sharedIds).all();
      const entities = (await this.deps.entitiesDS.getAllBySharedId(sharedIds)).getDataOrThrow();

      entities.forEach(entity => {
        const entityThumbnails = allThumbnails.filter(t => t.entity === entity.sharedId);
        entity.setPreview(entityThumbnails, defaultLanguage);
      });
      await this.deps.entitiesDS.bulkUpdate(entities);
    });
  }
}
