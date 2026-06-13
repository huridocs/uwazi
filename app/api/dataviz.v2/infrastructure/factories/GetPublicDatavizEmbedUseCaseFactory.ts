import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { GetPublicDatavizEmbedUseCase } from '#api/dataviz.v2/application/useCases/GetPublicDatavizEmbed.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';

class GetPublicDatavizEmbedUseCaseFactory {
  static default(overrides?: { targetLanguage?: LanguageISO6391 }) {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager;

    return new GetPublicDatavizEmbedUseCase(
      {
        datavizDS: DatavizDataSourceFactory.default(),
        snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant, targetLanguage: overrides?.targetLanguage }
    );
  }
}

export { GetPublicDatavizEmbedUseCaseFactory };
