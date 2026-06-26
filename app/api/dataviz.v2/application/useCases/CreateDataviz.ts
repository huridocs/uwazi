import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { z } from 'zod';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { normalizeDatavizRefresh } from '#shared/dataviz/normalizeDatavizRefresh.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { planSnapshotPersistence } from '#api/dataviz.v2/application/services/persistDatavizSnapshot.js';
import { createDatavizInputSchema } from '#api/dataviz.v2/application/contracts/datavizInputSchemas.js';

type Input = z.infer<typeof createDatavizInputSchema>;

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
  scheduler: DatavizScheduler;
};

class CreateDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  static inputSchema = createDatavizInputSchema;

  async execute(input: Input): Promise<Output> {
    const id = this.idGenerator.generate();

    const exists = await this.deps.datavizDS.existsByName(input.name);
    if (exists) {
      throw new Error(`A dataviz named "${input.name}" already exists`);
    }

    const dataviz = new Dataviz({
      id,
      name: input.name,
      description: input.description,
      dataSource: input.dataSource as DatavizDefinition['dataSource'],
      query: input.query as DatavizDefinition['query'],
      manualData: input.manualData as DatavizDefinition['manualData'],
      chart: input.chart as DatavizDefinition['chart'],
      appearance: input.appearance as DatavizDefinition['appearance'],
      refresh: normalizeDatavizRefresh(input.refresh as DatavizDefinition['refresh']),
      embedPublic: input.embedPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { snapshot, datavizWithRefresh } = await planSnapshotPersistence(
      dataviz,
      this.getActor(),
      {
        queryExecutor: this.deps.queryExecutor,
        templatesDS: this.deps.templatesDS,
      }
    );

    await this.transactionManager.run(async () => {
      await this.deps.datavizDS.create(datavizWithRefresh);
      await this.deps.snapshotsDS.upsert(snapshot);
    });

    const saved = datavizWithRefresh;

    if (saved.isScheduled) {
      await this.deps.scheduler.schedule(saved, this.getActor(), false);
    }

    return saved;
  }
}

export { CreateDatavizUseCase };
