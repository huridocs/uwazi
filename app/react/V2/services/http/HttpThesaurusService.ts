import * as thesauriApi from '#V2/api/thesauri/index.js';
import type { ThesaurusService } from '../contracts/ThesaurusService.js';

const httpThesaurusService: ThesaurusService = {
  getAll: async ({ headers } = {}) => thesauriApi.getAll(headers),

  getById: async (id, { headers } = {}) => thesauriApi.getById(id, headers),

  upsert: async (thesaurus, { headers } = {}) => thesauriApi.upsert(thesaurus, headers),

  delete: async (ids, { headers } = {}) => {
    const results = await Promise.all(ids.map(async id => thesauriApi.remove(id, headers)));
    const failed = results.find(([, error]) => error);
    if (failed?.[1]) {
      return [undefined as never, failed[1]];
    }
    return [undefined];
  },

  importFromFile: async (thesaurus, file, { headers } = {}) =>
    thesauriApi.importFromFile(thesaurus, file, headers),
};

export { httpThesaurusService };
