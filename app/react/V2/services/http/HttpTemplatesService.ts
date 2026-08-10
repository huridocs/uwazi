import * as templatesApi from '#V2/api/templates/index.js';
import type { TemplatesService } from '../contracts/TemplatesService.js';

const httpTemplatesService: TemplatesService = {
  getAll: async ({ headers } = {}) => templatesApi.getAll(headers),

  getById: async (id, { headers } = {}) => templatesApi.getById(id, headers),

  checkEntityCounts: async (templateIds, { headers } = {}) =>
    templatesApi.checkEntityCounts(templateIds, headers),

  upsert: async (template, { headers } = {}) => templatesApi.upsert(template, headers),

  delete: async (ids, { headers } = {}) => {
    const results = await Promise.all(ids.map(async id => templatesApi.remove(id, headers)));
    const failed = results.find(([, error]) => error);
    if (failed?.[1]) {
      return [undefined as never, failed[1]];
    }
    return [undefined];
  },

  setDefault: async (id, { headers } = {}) => templatesApi.setDefault(id, headers),
};

export { httpTemplatesService };
