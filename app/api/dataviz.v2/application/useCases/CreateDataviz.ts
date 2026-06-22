import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { validateLiveRefreshAllowed } from '#api/dataviz.v2/domain/validators/validateLiveRefreshAllowed.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { normalizeDatavizRefresh } from '#shared/dataviz/normalizeDatavizRefresh.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { persistDatavizSnapshot } from '#api/dataviz.v2/application/services/persistDatavizSnapshot.js';

type Input = Omit<DatavizDefinition, 'id' | 'createdAt' | 'updatedAt'>;

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
  scheduler: DatavizScheduler;
};

class CreateDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const id = this.idGenerator.generate();

    if (input.refresh.refreshMode === 'live' && !isManualDataSource(input.dataSource)) {
      validateLiveRefreshAllowed(input.refresh.refreshMode, input.query);
    }

    const exists = await this.deps.datavizDS.existsByName(input.name);
    if (exists) {
      throw new Error(`A dataviz named "${input.name}" already exists`);
    }

    const dataviz = new Dataviz({
      id,
      name: input.name,
      description: input.description,
      dataSource: input.dataSource,
      query: input.query,
      manualData: input.manualData,
      chart: input.chart,
      appearance: input.appearance,
      refresh: normalizeDatavizRefresh(input.refresh),
      embedPublic: input.embedPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { dataviz: saved } = await persistDatavizSnapshot(dataviz, this.getActor(), {
      datavizDS: this.deps.datavizDS,
      snapshotsDS: this.deps.snapshotsDS,
      queryExecutor: this.deps.queryExecutor,
      templatesDS: this.deps.templatesDS,
      transactionManager: this.transactionManager,
    }, 'create');

    if (saved.isScheduled) {
      await this.deps.scheduler.schedule(saved, this.getActor(), false);
    }

    return saved;
  }
}

export { CreateDatavizUseCase };
