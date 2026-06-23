import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type Params = {
  languageKey: LanguageISO6391;
  sharedIds: string[];
};

type JobDependencies = {
  filesDS: FilesDataSource;
  entitiesDS: EntitiesDataSource;
  settingsDS: SettingsDataSource;
  transactionManager: TransactionManager;
};

export class EntityPreviewBatchHandler extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo?: JobInfo) {
    const { sharedIds } = params;

    await this.deps.transactionManager.run(async () => {
      const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
      const allThumbnails = await this.deps.filesDS.getThumbnails(sharedIds);
      const entities = (await this.deps.entitiesDS.getAllBySharedId(sharedIds)).getDataOrThrow();

      const thumbnailsByEntity = allThumbnails.reduce<Map<string, typeof allThumbnails>>(
        (grouped, thumbnail) => {
          const list = grouped.get(thumbnail.entity) ?? [];
          list.push(thumbnail);
          grouped.set(thumbnail.entity, list);
          return grouped;
        },
        new Map()
      );

      entities.forEach(entity => {
        entity.setPreview(thumbnailsByEntity.get(entity.sharedId) ?? [], defaultLanguage);
      });
      await this.deps.entitiesDS.bulkUpdate(entities);
    });
  }
}
