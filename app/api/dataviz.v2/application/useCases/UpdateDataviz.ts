import { computeQueryHash } from '#shared/dataviz/computeQueryHash.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { validateLiveRefreshAllowed } from '#api/dataviz.v2/domain/validators/validateLiveRefreshAllowed.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { normalizeDatavizRefresh } from '#shared/dataviz/normalizeDatavizRefresh.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { planSnapshotPersistence } from '#api/dataviz.v2/application/services/persistDatavizSnapshot.js';
import { shouldPersistSnapshotOnSave } from '#api/dataviz.v2/application/services/shouldPersistSnapshotOnSave.js';

type Input = DatavizDefinition;

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
  scheduler: DatavizScheduler;
};

class UpdateDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const existingResult = await this.deps.datavizDS.getById(input.id);
    if (existingResult.isError()) {
      throw new DatavizNotFoundError(input.id);
    }
    const existing = existingResult.getDataOrThrow();

    if (input.refresh.refreshMode === 'live' && !isManualDataSource(input.dataSource)) {
      validateLiveRefreshAllowed(input.refresh.refreshMode, input.query);
    }

    const exists = await this.deps.datavizDS.existsByName(input.name, input.id);
    if (exists) {
      throw new Error(`A dataviz named "${input.name}" already exists`);
    }

    const dataviz = new Dataviz({
      id: input.id,
      name: input.name,
      description: input.description,
      dataSource: input.dataSource,
      query: input.query,
      manualData: input.manualData,
      chart: input.chart,
      appearance: input.appearance,
      refresh: normalizeDatavizRefresh(input.refresh),
      processing: existing.processing,
      embedPublic: input.embedPublic ?? existing.embedPublic,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const queryChanged = computeQueryHash(existing.query) !== computeQueryHash(dataviz.query);
    const refreshChanged = JSON.stringify(existing.refresh) !== JSON.stringify(dataviz.refresh);
    const snapshotChanged = shouldPersistSnapshotOnSave(existing, dataviz);

    let saved = dataviz;

    if (snapshotChanged) {
      const { snapshot, datavizWithRefresh } = await planSnapshotPersistence(
        dataviz,
        this.getActor(),
        {
          queryExecutor: this.deps.queryExecutor,
          templatesDS: this.deps.templatesDS,
        }
      );

      await this.transactionManager.run(async () => {
        await this.deps.datavizDS.update(datavizWithRefresh);
        await this.deps.snapshotsDS.upsert(snapshot);
      });

      saved = datavizWithRefresh;
    } else {
      await this.transactionManager.run(async () => {
        await this.deps.datavizDS.update(dataviz);
      });
    }

    await this.deps.scheduler.cancelPending(saved.id);

    if (saved.isScheduled) {
      const runImmediately = !snapshotChanged && (queryChanged || refreshChanged);
      await this.deps.scheduler.schedule(saved, this.getActor(), runImmediately);
    }

    return saved;
  }
}

export { UpdateDatavizUseCase };
