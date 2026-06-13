import { computeQueryHash } from '#shared/dataviz/computeQueryHash.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { validateLiveRefreshAllowed } from '#api/dataviz.v2/domain/validators/validateLiveRefreshAllowed.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';

type Input = DatavizDefinition;

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  scheduler: DatavizSchedulerService;
};

class UpdateDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const existingResult = await this.deps.datavizDS.getById(input.id);
    if (existingResult.isError()) {
      throw new DatavizNotFoundError(input.id);
    }
    const existing = existingResult.getDataOrThrow();

    if ((input.status ?? 'draft') === 'published' && !isManualDataSource(input.dataSource)) {
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
      status: input.status,
      dataSource: input.dataSource,
      query: input.query,
      manualData: input.manualData,
      chart: input.chart,
      appearance: input.appearance,
      refresh: input.refresh,
      processing: existing.processing,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const queryChanged = computeQueryHash(existing.query) !== computeQueryHash(dataviz.query);
    const refreshChanged =
      JSON.stringify(existing.refresh) !== JSON.stringify(dataviz.refresh);

    await this.transactionManager.run(async () => {
      await this.deps.datavizDS.update(dataviz);

      if (queryChanged) {
        await this.deps.snapshotsDS.deleteByDatavizId(dataviz.id);
      }
    });

    await this.deps.scheduler.cancelPending(dataviz.id);

    if (dataviz.isScheduled) {
      await this.deps.scheduler.schedule(dataviz, this.actor, queryChanged || refreshChanged);
    }

    return dataviz;
  }
}

export { UpdateDatavizUseCase };
