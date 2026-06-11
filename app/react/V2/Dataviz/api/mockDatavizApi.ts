import {
  carsByColorDto,
  createDefaultDatavizDefinition,
  DATAVIZ_CARS_BY_COLOR_ID,
  mileageBarDto,
  multiSourceByTemplateDto,
  personasSexByCountryDto,
  yearHistogramDto,
} from '#V2/Dataviz/fixtures/datavizFixtures.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO, DatavizDefinition } from '#V2/Dataviz/types/index.js';
import type { DatavizApi, DatavizApiOptions } from './contracts.js';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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

const resolveDataForDefinition = (definition: DatavizDefinition): DatavizDataDTO => {
  const dimension = definition.query.dimensions[0];
  const base = {
    datavizId: definition.id,
    generatedAt: new Date().toISOString(),
    stale: false,
  };

  if (definition.query.dimensions.length >= 2) {
    return applyFilterDemo({ ...personasSexByCountryDto, ...base }, definition);
  }

  if (definition.query.sources.length > 1 || dimension?.property === TEMPLATE_DIMENSION_PROPERTY) {
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
      const saved = {
        ...definition,
        updatedAt: new Date().toISOString(),
      };
      definitions.set(definition.id, saved);
      return saved;
    },

    deleteDefinition: async (id: string) => {
      await delay(100);
      definitions.delete(id);
    },

    getData: async (definition: DatavizDefinition) => {
      await delay(dataDelayMs);
      return resolveDataForDefinition(definition);
    },
  };
};

export { createMockDatavizApi };
