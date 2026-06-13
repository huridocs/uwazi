import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';

type Input = { id: string };

type Output = { id: string };

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  scheduler: DatavizSchedulerService;
};

class DeleteDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ id }: Input): Promise<Output> {
    await this.deps.scheduler.cancelPending(id);

    await this.transactionManager.run(async () => {
      await this.deps.snapshotsDS.deleteByDatavizId(id);
      await this.deps.datavizDS.delete(id);
    });

    return { id };
  }
}

export { DeleteDatavizUseCase };
