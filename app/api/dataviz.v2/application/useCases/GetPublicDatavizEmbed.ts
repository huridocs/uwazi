import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { DatavizNotFoundError, DatavizUnauthorizedError } from '#api/dataviz.v2/domain/errors.js';
import { resolveDatavizRenderSnapshot } from '#api/dataviz.v2/application/services/resolveDatavizRenderSnapshot.js';

type Input = {
  id: string;
};

type Output = DatavizEmbedPayload;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  settingsDS: SettingsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
};

class GetPublicDatavizEmbedUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ id }: Input): Promise<Output> {
    const settings = await this.deps.settingsDS.get();

    const datavizResult = await this.deps.datavizDS.getById(id);
    if (datavizResult.isError()) {
      throw new DatavizNotFoundError(id);
    }

    const dataviz = datavizResult.getData();
    if (settings.private && this.getActor().isAnonymous() && !dataviz.embedPublic) {
      throw new DatavizUnauthorizedError();
    }

    const defaultLocale =
      settings.languages?.find(language => language.default)?.key ?? this.targetLanguage;

    return resolveDatavizRenderSnapshot(
      {
        dataviz,
        locale: this.targetLanguage,
        defaultLocale,
      },
      {
        snapshotsDS: this.deps.snapshotsDS,
        queryExecutor: this.deps.queryExecutor,
        templatesDS: this.deps.templatesDS,
        actor: this.getActor(),
      }
    );
  }
}

export { GetPublicDatavizEmbedUseCase };
