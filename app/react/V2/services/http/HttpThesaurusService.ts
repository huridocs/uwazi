import { fromLegacyApi } from '#shared/apiClient/index.js';
import * as thesauriApi from '#V2/api/thesauri/index.js';
import type { ThesaurusService } from '../contracts/ThesaurusService.js';

const httpThesaurusService: ThesaurusService = {
  getAll: async ({ headers } = {}) => fromLegacyApi(async () => thesauriApi.get({}, headers)),

  getById: async (id, { headers } = {}) =>
    fromLegacyApi(async () => {
      const rows = await thesauriApi.get({ _id: id }, headers);
      return rows[0];
    }),

  upsert: async (thesaurus, { headers } = {}) =>
    fromLegacyApi(async () => thesauriApi.save(thesaurus, headers)),

  delete: async (ids, { headers } = {}) =>
    fromLegacyApi(async () => {
      await Promise.all(ids.map(async _id => thesauriApi.deleteThesauri({ _id }, headers)));
    }),

  importFromFile: async (thesaurus, file) =>
    fromLegacyApi(async () => thesauriApi.importThesaurus(thesaurus, file)),
};

export { httpThesaurusService };
