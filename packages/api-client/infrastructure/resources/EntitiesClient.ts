import { GetEntityController } from '#api/core/infrastructure/express/entity/GetEntityController.js';

import type { EntitiesResource } from '../../application/ServerApiClient.js';
import type { EntitiesResponse, EntityQuery } from '../../application/contracts/Entities.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class EntitiesClient implements EntitiesResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async get(query: EntityQuery) {
    return this.invoker.invoke<EntitiesResponse>(GetEntityController, query);
  }
}

export { EntitiesClient };
