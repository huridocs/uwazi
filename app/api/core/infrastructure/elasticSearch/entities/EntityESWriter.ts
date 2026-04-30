import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition.js';
import type { MappedDocument } from './EntityElasticDocumentMapper.js';

type EntityESWriterDeps = {
  esClient: TenantAwareESClient;
};

class EntityESWriter {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: EntityESWriterDeps) {}

  async index(ops: MappedDocument[], refresh = false): Promise<void> {
    if (ops.length === 0) {
      return;
    }

    const operations = ops.map(({ sharedId, document }) => ({
      id: sharedId,
      document,
    }));

    await this.deps.esClient.bulk({
      alias: this.alias,
      operations,
      routing: this.deps.esClient.tenantId,
      refresh,
    });
  }

  async deleteBySharedIds(sharedIds: string[], refresh = false): Promise<void> {
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

  async deleteByTemplateIds(templateIds: string[], refresh = false): Promise<void> {
    if (templateIds.length === 0) {
      return;
    }

    await this.deps.esClient.deleteByQuery({
      alias: this.alias,
      routing: this.deps.esClient.tenantId,
      query: {
        terms: {
          template: templateIds,
        },
      },
      refresh,
    });
  }
}

export { EntityESWriter };
export type { EntityESWriterDeps };
