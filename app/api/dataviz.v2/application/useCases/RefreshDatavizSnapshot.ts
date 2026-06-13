import { computeNextScheduledAtIso } from '#shared/dataviz/computeNextLockedUntil.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { DatavizInvalidQueryError, DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import {
  buildRenderSnapshot,
  templateIdsFromQuery,
} from '#api/dataviz.v2/application/services/buildRenderSnapshot.js';
import { isLegacySnapshotPayload } from '#api/dataviz.v2/application/services/resolveDatavizData.js';

type Input = { datavizId: string };

type Output = DatavizDataDTO;

type Deps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
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

      const templateIds = templateIdsFromQuery(dataviz.query);
      const templates =
        templateIds.length > 0
          ? (await this.deps.templatesDS.getByIds(templateIds).all()).map(template => ({
              id: template.id,
              name: template.name,
              color: template.color,
            }))
          : [];

      const snapshot = buildRenderSnapshot(dataviz, dto, templates);

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
        dataSource: dataviz.dataSource,
        query: dataviz.query,
        manualData: dataviz.manualData,
        chart: dataviz.chart,
        appearance: dataviz.appearance,
        refresh,
        processing: { active: false },
        createdAt: dataviz.createdAt,
        updatedAt: new Date(),
      });

      await this.deps.datavizDS.update(updated);

      const payload = snapshot.payload;
      return isLegacySnapshotPayload(payload) ? payload : payload.data;
    } catch (error) {
      await this.deps.datavizDS.setProcessing(datavizId, { active: false });
      throw error;
    }
  }
}

export { RefreshDatavizSnapshotUseCase };
