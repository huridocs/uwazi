import type { DatavizCreateInput } from '#V2/api/dataviz/index.js';
import { DATAVIZ_DRAFT_ID, type DatavizDefinition } from '#shared/types/datavizSchema.js';

const createDraftDatavizInput = (options?: { templateId?: string }): DatavizCreateInput => ({
  name: 'Untitled visualization',
  description: '',
  status: 'draft',
  query: {
    sources: options?.templateId ? [{ templateId: options.templateId }] : [],
    dimensions: [],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: {
    type: 'pie',
    showLegend: true,
    showTooltip: true,
    showLabels: true,
  },
  appearance: {
    colorMode: 'theme',
  },
  refresh: {
    refreshMode: 'live',
  },
});

const createLocalDraftDefinition = (options?: { templateId?: string }): DatavizDefinition => ({
  ...createDraftDatavizInput(options),
  id: DATAVIZ_DRAFT_ID,
});

export { createDraftDatavizInput, createLocalDraftDefinition, DATAVIZ_DRAFT_ID };
