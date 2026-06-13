import { computeNextScheduledAtIso } from '#shared/dataviz/computeNextLockedUntil.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { DatavizInvalidQueryError, DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';

type Input = { datavizId: string };

type Output = DatavizDataDTO;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
};

class RefreshDatavizSnapshotUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ datavizId }: Input): Promise<Output> {
    const datavizResult = await this.deps.datavizDS.getById(datavizId);
    if (datavizResult.isError()) {
      throw new DatavizNotFoundError(datavizId);
    }
    const dataviz = datavizResult.getDataOrThrow();

    if (isManualDataSource(dataviz.dataSource)) {
      throw new DatavizInvalidQueryError('Manual data visualizations cannot be refreshed');
    }

    await this.deps.datavizDS.setProcessing(datavizId, {
      active: true,
      startedAt: new Date().toISOString(),
    });

    try {
      validateQueryStructure(dataviz.query);

      const dto = await this.deps.queryExecutor.execute(dataviz.query, {
        actor: this.getActor(),
        language: this.resolveTargetLanguage(dataviz.query.language),
        datavizId,
        appearance: dataviz.appearance,
      });

      const snapshot = {
        datavizId,
        queryHash: dataviz.queryHash,
        payload: { ...dto, stale: false },
        generatedAt: new Date(),
      };

      await this.deps.snapshotsDS.upsert(snapshot);

      const refresh = {
        ...dataviz.refresh,
        lastRefreshedAt: new Date().toISOString(),
        ...(dataviz.isScheduled
          ? { nextScheduledAt: computeNextScheduledAtIso(dataviz.refresh) }
          : {}),
      };

      const updated = new Dataviz({
        id: dataviz.id,
        name: dataviz.name,
        description: dataviz.description,
        status: dataviz.status,
        query: dataviz.query,
        chart: dataviz.chart,
        appearance: dataviz.appearance,
        refresh,
        processing: { active: false },
        createdAt: dataviz.createdAt,
        updatedAt: new Date(),
      });

      await this.deps.datavizDS.update(updated);

      return snapshot.payload;
    } catch (error) {
      await this.deps.datavizDS.setProcessing(datavizId, { active: false });
      throw error;
    }
  }
}

export { RefreshDatavizSnapshotUseCase };
