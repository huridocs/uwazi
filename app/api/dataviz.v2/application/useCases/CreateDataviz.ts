import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { validateLiveRefreshAllowed } from '#api/dataviz.v2/domain/validators/validateLiveRefreshAllowed.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';

type Input = Omit<DatavizDefinition, 'id' | 'createdAt' | 'updatedAt'>;

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
  scheduler: DatavizSchedulerService;
};

class CreateDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const id = this.idGenerator.generate();

    if ((input.status ?? 'draft') === 'published' && !isManualDataSource(input.dataSource)) {
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
      status: input.status,
      dataSource: input.dataSource,
      query: input.query,
      manualData: input.manualData,
      chart: input.chart,
      appearance: input.appearance,
      refresh: input.refresh,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.transactionManager.run(async () => {
      await this.deps.datavizDS.create(dataviz);
    });

    if (dataviz.isScheduled) {
      await this.deps.scheduler.schedule(dataviz, this.actor);
    }

    return dataviz;
  }
}

export { CreateDatavizUseCase };
