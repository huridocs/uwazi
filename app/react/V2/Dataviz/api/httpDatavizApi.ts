import * as datavizAPI from '#V2/api/dataviz/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { DatavizApi } from './contracts.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { DATAVIZ_DRAFT_ID } from '#shared/types/datavizSchema.js';

const isPersistedId = (id: string) => Boolean(id) && id !== DATAVIZ_DRAFT_ID;

const assertSuccess = <T>(result: T | FetchResponseError): T => {
  if (result instanceof FetchResponseError) {
    throw result;
  }
  return result;
};

const toCreateInput = (definition: DatavizDefinition): datavizAPI.DatavizCreateInput => {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = definition;
  return input;
};

const createHttpDatavizApi = (): DatavizApi => ({
  async getDefinition(id) {
    return assertSuccess(await datavizAPI.getById(id));
  },

  async saveDefinition(definition) {
    if (isPersistedId(definition.id)) {
      return assertSuccess(await datavizAPI.update(definition));
    }
    return assertSuccess(await datavizAPI.create(toCreateInput(definition)));
  },

  async deleteDefinition(id) {
    const result = await datavizAPI.remove(id);
    if (result instanceof FetchResponseError) {
      throw result;
    }
  },

  async getData({ id, query }) {
    return assertSuccess(await datavizAPI.preview(id, query));
  },

  async refreshSnapshot(id) {
    if (!isPersistedId(id)) {
      throw new Error('Save the visualization before refreshing the snapshot.');
    }
    return assertSuccess(await datavizAPI.refreshSnapshot(id));
  },
});

export { createHttpDatavizApi, isPersistedId };
