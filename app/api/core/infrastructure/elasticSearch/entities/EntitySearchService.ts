import { AuthorizedEntityESClient } from './AuthorizedElasticEntityClient';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition';

type Deps = {
  elasticClient: AuthorizedEntityESClient;
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
