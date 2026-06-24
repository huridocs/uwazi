import { DATAVIZ_DRAFT_ID } from '#shared/types/datavizSchema.js';
import {
  carsByColorDto,
  createDefaultDatavizDefinition,
  DATAVIZ_CARS_BY_COLOR_ID,
  mileageBarDto,
  multiSourceByTemplateDto,
  wildlifeByHabitatDto,
  yearHistogramDto,
} from '#V2/Dataviz/fixtures/datavizFixtures.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO, DatavizDefinition } from '#V2/Dataviz/types/index.js';
import type { DatavizApi, DatavizApiOptions } from './contracts.js';

const delay = async (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const definitions = new Map<string, DatavizDefinition>([
  [DATAVIZ_CARS_BY_COLOR_ID, createDefaultDatavizDefinition()],
]);

const applyFilterDemo = (dto: DatavizDataDTO, definition: DatavizDefinition): DatavizDataDTO => {
  const filters = definition.query.filters || [];
  if (filters.length === 0) return dto;

  const yearFilter = filters.find(f => f.property === 'year');
  if (yearFilter && yearFilter.operator === 'gte') {
    const scale = (value: number) => Math.round(value * 0.7);
    const reduced = dto.series.map(series => ({
      ...series,
      points: series.points.map(p => ({
        ...p,
        value: scale(p.value),
        breakdown: p.breakdown?.map(b => ({ ...b, value: scale(b.value) })),
      })),
    }));
    return {
      ...dto,
      meta: {
        ...dto.meta,
        appliedFilters: filters,
        totalEntities: Math.round(dto.meta.totalEntities * 0.7),
      },
      series: reduced,
    };
  }

  return { ...dto, meta: { ...dto.meta, appliedFilters: filters } };
};

const resolveDataForQuery = (id: string, query: DatavizDefinition['query']): DatavizDataDTO => {
  const dimension = query.dimensions[0];
  const base = {
    datavizId: id,
    generatedAt: new Date().toISOString(),
    stale: false,
  };

  const definition = { id, query } as DatavizDefinition;

  if (query.dimensions.length >= 2) {
    return applyFilterDemo({ ...wildlifeByHabitatDto, ...base }, definition);
  }

  if (query.sources.length > 1 || dimension?.property === TEMPLATE_DIMENSION_PROPERTY) {
    return applyFilterDemo({ ...multiSourceByTemplateDto, ...base }, definition);
  }

  if (dimension?.property === 'year') {
    return applyFilterDemo({ ...yearHistogramDto, ...base }, definition);
  }

  if (dimension?.property === 'mileage') {
    return applyFilterDemo({ ...mileageBarDto, ...base }, definition);
  }

  return applyFilterDemo({ ...carsByColorDto, ...base }, definition);
};

const createMockDatavizApi = (options: DatavizApiOptions = {}): DatavizApi => {
  const dataDelayMs = options.dataDelayMs ?? 200;
  const saveDelayMs = options.saveDelayMs ?? 200;

  return {
    getDefinition: async (id: string) => {
      await delay(50);
      const def = definitions.get(id);
      if (!def) {
        throw new Error(`Dataviz not found: ${id}`);
      }
      return { ...def };
    },

    saveDefinition: async (definition: DatavizDefinition) => {
      await delay(saveDelayMs);
      const isNew = definition.id === DATAVIZ_DRAFT_ID;
      const id = isNew ? `dv_${Date.now()}` : definition.id;
      const now = new Date().toISOString();
      const saved = {
        ...definition,
        id,
        createdAt: definition.createdAt ?? now,
        updatedAt: now,
      };
      if (isNew) {
        definitions.delete(DATAVIZ_DRAFT_ID);
      }
      definitions.set(id, saved);
      return saved;
    },

    deleteDefinition: async (id: string) => {
      await delay(100);
      definitions.delete(id);
    },

    getData: async ({ id, query }) => {
      await delay(dataDelayMs);
      return resolveDataForQuery(id, query);
    },

    refreshSnapshot: async (id: string) => {
      await delay(dataDelayMs);
      const definition = definitions.get(id);
      if (!definition) {
        throw new Error(`Dataviz not found: ${id}`);
      }
      const payload = resolveDataForQuery(id, definition.query);
      const lastRefreshedAt = new Date().toISOString();
      definitions.set(id, {
        ...definition,
        refresh: { ...definition.refresh, lastRefreshedAt },
        processing: { active: false },
        updatedAt: lastRefreshedAt,
      });
      return payload;
    },
  };
};

export { createMockDatavizApi };
