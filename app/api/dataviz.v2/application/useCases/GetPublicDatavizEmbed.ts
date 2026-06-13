import type { DatavizPublicEmbedDTO } from '#shared/types/datavizSchema.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { DatavizNotFoundError, DatavizUnauthorizedError } from '#api/dataviz.v2/domain/errors.js';
import { resolveDatavizData } from '#api/dataviz.v2/application/services/resolveDatavizData.js';

type Input = {
  id: string;
};

type Output = DatavizPublicEmbedDTO;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  settingsDS: SettingsDataSource;
};

class GetPublicDatavizEmbedUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ id }: Input): Promise<Output> {
    const settings = await this.deps.settingsDS.get();
    if (settings.private && this.getActor().isAnonymous()) {
      throw new DatavizUnauthorizedError();
    }

    const datavizResult = await this.deps.datavizDS.getById(id);
    if (datavizResult.isError()) {
      throw new DatavizNotFoundError(id);
    }

    const dataviz = datavizResult.getData();
    const data = await resolveDatavizData(
      {
        id,
        dataviz,
        options: { allowLiveQuery: false, requirePublished: true },
        actor: this.getActor(),
        language: this.targetLanguage,
      },
      this.deps
    );

    return {
      data,
      chart: dataviz.chart,
      appearance: dataviz.appearance,
      sources: dataviz.query.sources,
    };
  }
}

export { GetPublicDatavizEmbedUseCase };
