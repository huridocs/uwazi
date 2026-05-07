import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition.js';
import type { MappedDocument } from './FullTextElasticDocumentMapper.js';

type FullTextESWriterDeps = {
  esClient: TenantAwareESClient;
};

class FullTextESWriter {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: FullTextESWriterDeps) {}

  get tenantId(): string {
    return this.deps.esClient.tenantId;
  }

  async index(ops: MappedDocument[], refresh = false): Promise<void> {
    if (ops.length === 0) {
      return;
    }

    await this.deps.esClient.bulk({
      alias: this.alias,
      operations: ops,
      routing: this.deps.esClient.tenantId,
      refresh,
    });
  }

  async deleteByFilenames(filenames: string[], refresh = false): Promise<void> {
    if (filenames.length === 0) {
      return;
    }

    await this.deps.esClient.deleteByQuery({
      alias: this.alias,
      routing: this.deps.esClient.tenantId,
      query: {
        bool: {
          filter: [{ terms: { filename: filenames } }, { term: { fullText: 'fullText' } }],
        },
      },
      refresh,
    });
  }
}

export { FullTextESWriter };
export type { FullTextESWriterDeps };
