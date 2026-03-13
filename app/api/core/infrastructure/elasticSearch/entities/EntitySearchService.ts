import { TenantAwareESClient } from '../TenantAwareESClient';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition';

type Deps = {
  elasticClient: TenantAwareESClient;
};

class EntitySearchService {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: Deps) {}

  async getAll() {
    const entities = await this.deps.elasticClient.search({
      alias: this.alias,
      query: {},
    });

    return entities;
  }
}

export { EntitySearchService };
