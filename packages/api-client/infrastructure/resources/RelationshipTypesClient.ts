import { GetRelationshipTypesController } from '#api/core/infrastructure/express/relationshipType/GetRelationshipTypesController.js';

import type { RelationshipTypesResource } from '../../application/ServerApiClient.js';
import type { RelationshipTypesResponse } from '../../application/contracts/RelationshipTypes.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class RelationshipTypesClient implements RelationshipTypesResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getAll() {
    return this.invoker.invoke<RelationshipTypesResponse>(GetRelationshipTypesController, {
      method: 'GET',
      path: '/api/relationtypes',
    });
  }
}

export { RelationshipTypesClient };
