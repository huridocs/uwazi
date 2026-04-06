import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import { EntityElasticDocumentMapper } from './EntityElasticDocumentMapper.js';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition.js';

type EntityIndexerServiceDeps = {
  esClient: TenantAwareESClient;
  slotsDAO: MongoSlotsDAO;
};

class EntityIndexerService {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: EntityIndexerServiceDeps) {}

  async index(entities: EntityDBO[], refresh = false): Promise<void> {
    if (entities.length === 0) {
      return;
    }

    const slotMap = await this.deps.slotsDAO.getSlotMap(this.deps.esClient.tenantId);
    const documents = EntityElasticDocumentMapper.toDocuments(entities, slotMap);

    if (documents.length === 0) {
      return;
    }

    const operations = entities.map((entity, index) => ({
      id: entity._id.toString(),
      document: documents[index],
    }));

    await this.deps.esClient.bulk({
      alias: this.alias,
      operations,
      routing: this.deps.esClient.tenantId,
      refresh,
    });
  }

  async delete(sharedIds: string[], refresh = false): Promise<void> {
    if (sharedIds.length === 0) {
      return;
    }

    await this.deps.esClient.deleteByQuery({
      alias: this.alias,
      routing: this.deps.esClient.tenantId,
      query: {
        terms: {
          sharedId: sharedIds,
        },
      },
      refresh,
    });
  }
}

export { EntityIndexerService };
export type { EntityIndexerServiceDeps };
