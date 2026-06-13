import type { DatavizDataDTO, DatavizQuery } from '#shared/types/datavizSchema.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import {
  loadDatavizForData,
  resolveDatavizData,
} from '#api/dataviz.v2/application/services/resolveDatavizData.js';

type Input = {
  id: string;
  draftQuery?: DatavizQuery;
};

type Output = DatavizDataDTO;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
};

class GetDatavizDataUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ id, draftQuery }: Input): Promise<Output> {
    const isPreview = Boolean(draftQuery);
    const dataviz = await loadDatavizForData(id, isPreview, this.deps.datavizDS);

    if (!dataviz) {
      const query = draftQuery!;
      validateQueryStructure(query);
      return this.deps.queryExecutor.execute(query, {
        actor: this.getActor(),
        language: this.resolveTargetLanguage(query.language),
        datavizId: id,
      });
    }

    return resolveDatavizData(
      {
        id,
        dataviz,
        draftQuery,
        options: { allowLiveQuery: true, requirePublished: false },
        actor: this.getActor(),
        language: this.resolveTargetLanguage(dataviz.query.language),
      },
      this.deps
    );
  }
}

export { GetDatavizDataUseCase };
