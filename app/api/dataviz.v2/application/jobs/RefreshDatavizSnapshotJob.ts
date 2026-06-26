import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { DatavizInvalidQueryError, DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { planSnapshotPersistence } from '#api/dataviz.v2/application/services/persistDatavizSnapshot.js';

type Input = { datavizId: string };

type Output = DatavizDataDTO;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
};

class RefreshDatavizSnapshotJob extends AbstractUseCase<Input, Output, Deps> {
  async execute({ datavizId }: Input): Promise<Output> {
    const datavizResult = await this.deps.datavizDS.getById(datavizId);
    if (datavizResult.isError()) {
      throw new DatavizNotFoundError(datavizId);
    }
    const dataviz = datavizResult.getDataOrThrow();

    if (dataviz.isManual) {
      throw new DatavizInvalidQueryError('Manual data visualizations cannot be refreshed');
    }

    await this.deps.datavizDS.setProcessing(datavizId, {
      active: true,
      startedAt: new Date().toISOString(),
    });

    try {
      const { snapshot, datavizWithRefresh, snapshotData } = await planSnapshotPersistence(
        dataviz,
        this.getActor(),
        {
          queryExecutor: this.deps.queryExecutor,
          templatesDS: this.deps.templatesDS,
        }
      );

      await this.transactionManager.run(async () => {
        await this.deps.snapshotsDS.upsert(snapshot);
        await this.deps.datavizDS.update(datavizWithRefresh);
      });

      return snapshotData;
    } catch (error) {
      await this.deps.datavizDS.setProcessing(datavizId, { active: false });
      throw error;
    }
  }
}

export { RefreshDatavizSnapshotJob };
