import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { DatavizEmbedPayload, DatavizRuntimeFilter } from '#shared/types/datavizSchema.js';
import { filterDataForDisplay } from '#shared/dataviz/filterDataForDisplay.js';
import { buildManualDataDTO } from '#shared/dataviz/manualData.js';
import { buildTemplatesById } from '#shared/dataviz/bakeDatavizSnapshotColors.js';
import { buildRenderSnapshotPayload, templateIdsFromQuery } from './buildRenderSnapshot.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import {
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
} from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import type { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import type { User } from '#api/users.v2/model/User.js';
import { resolveExternalFilters } from './resolveExternalFilters.js';

type Input = {
  dataviz: Dataviz;
  locale: LanguageISO6391;
  defaultLocale: LanguageISO6391;
  externalFilters?: DatavizRuntimeFilter[];
};

type Deps = {
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
  actor: User;
};

const toEmbedPayload = (
  renderPayload: DatavizEmbedPayload,
  dataviz: Dataviz,
  locale: LanguageISO6391,
  defaultLocale: LanguageISO6391,
  stale = false
): DatavizEmbedPayload => ({
  data: filterDataForDisplay({ ...renderPayload.data, stale }, renderPayload.chart, {
    locale,
    defaultLocale,
    dimensions: dataviz.query.dimensions,
    measures: dataviz.query.measures,
  }),
  chart: renderPayload.chart,
  appearance: renderPayload.appearance,
});

const resolveLiveQueryPayload = async (
  dataviz: Dataviz,
  externalFilters: DatavizRuntimeFilter[] | undefined,
  deps: Deps
): Promise<DatavizEmbedPayload> => {
  validateQueryStructure(dataviz.query);

  const resolvedExternalFilters = await resolveExternalFilters(dataviz, externalFilters, {
    templatesDS: deps.templatesDS,
  });

  const data = await deps.queryExecutor.execute(dataviz.query, {
    actor: deps.actor,
    datavizId: dataviz.id,
    appearance: dataviz.appearance,
    externalFilters: resolvedExternalFilters,
  });

  const templateIds = templateIdsFromQuery(dataviz.query);
  const templates =
    templateIds.length > 0
      ? (await deps.templatesDS.getByIds(templateIds)).map(template => ({
          id: template.id,
          name: template.name,
          color: template.color,
        }))
      : [];

  return buildRenderSnapshotPayload(dataviz, data, buildTemplatesById(templates));
};

const resolveDatavizRenderSnapshot = async (
  { dataviz, locale, defaultLocale, externalFilters }: Input,
  deps: Deps
): Promise<DatavizEmbedPayload> => {
  if (dataviz.processing?.active) {
    throw new DatavizProcessingError(dataviz.id);
  }

  if (dataviz.isManual) {
    const manualPayload = buildRenderSnapshotPayload(
      dataviz,
      buildManualDataDTO(dataviz.id, dataviz.manualData)
    );
    return toEmbedPayload(manualPayload, dataviz, locale, defaultLocale);
  }

  const shouldForceLive = Boolean(externalFilters?.length);

  if (!dataviz.usesSnapshot || shouldForceLive) {
    const livePayload = await resolveLiveQueryPayload(dataviz, externalFilters, deps);
    return toEmbedPayload(livePayload, dataviz, locale, defaultLocale);
  }

  const snapshotResult = await deps.snapshotsDS.getByDatavizId(dataviz.id);
  if (snapshotResult.isError()) {
    throw new DatavizSnapshotUnavailableError(dataviz.id);
  }

  const snapshot = snapshotResult.getData();
  const stale = snapshot.queryHash !== dataviz.queryHash;

  return toEmbedPayload(snapshot.payload, dataviz, locale, defaultLocale, stale);
};

export { resolveDatavizRenderSnapshot };
