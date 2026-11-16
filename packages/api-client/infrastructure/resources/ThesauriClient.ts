import { GetThesauriController } from '#api/core/infrastructure/express/thesaurus/GetThesauriController.js';

import type { ThesauriResource } from '../../application/ServerApiClient.js';
import type { ThesauriQuery, ThesauriResponse } from '../../application/contracts/Thesauri.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class ThesauriClient implements ThesauriResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getAll(query: ThesauriQuery = {}) {
    return this.invoker.invoke<ThesauriResponse>(GetThesauriController, {
      method: 'GET',
      path: '/api/dictionaries',
      query,
    });
  }
}

export { ThesauriClient };
